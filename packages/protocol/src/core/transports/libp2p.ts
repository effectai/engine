import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import type {
  Connection,
  Libp2p,
  Transport as InternalLibp2pTransport,
  PeerId,
  PrivateKey,
  Stream,
} from "@libp2p/interface";
import { ping } from "@libp2p/ping";
import { type ServiceFactoryMap, createLibp2p } from "libp2p";

import { isMultiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { type MessageStream, pbStream } from "it-protobuf-stream";
import { EffectProtocolMessage } from "../messages/effect.js";
import { extractMessageType, shouldExpectResponse } from "../utils.js";
import type { MessageResponse, ResponseMap } from "../common/types.js";
import { ProtocolError } from "../errors.js";
import type {
  Entity,
  EntityWithTransports,
  Transport,
} from "../entity/factory.js";
import type { Datastore } from "interface-datastore";

type EffectMessageType = keyof EffectProtocolMessage;

export interface SendMessageOptions {
  timeout?: number;
  existingStream?: Stream;
}

export interface Libp2pMethods {
  sendMessage<T extends EffectProtocolMessage>(
    peerId: PeerId | Multiaddr,
    message: T,
    options?: SendMessageOptions,
  ): Promise<[MessageResponse<T> | null, ProtocolError | null]>;
  onMessage<T extends EffectMessageType>(
    type: T,
    handler: (
      payload: NonNullable<EffectProtocolMessage[T]>,
      context: { peerId: PeerId; connection: Connection },
    ) => Promise<EffectProtocolMessage | void>,
  ): EntityWithTransports<[Libp2pTransport]>;
  getPeerId(): PeerId;
  getMultiAddress(): Multiaddr[] | undefined;
  node: Libp2p;
}

export interface Libp2pInit {
  listen: string[];
  announce: string[];
  transports: ((components: any) => InternalLibp2pTransport)[];
  bootstrap?: string[];
  privateKey?: PrivateKey;
  autoStart?: boolean;
  services?: ServiceFactoryMap;
  datastore?: Datastore;
}

const DEFAULT_LIBP2P_OPTIONS: Partial<Libp2pInit> = {
  autoStart: true,
  bootstrap: [],
};

type MessageHandler = (
  payload: NonNullable<EffectProtocolMessage[EffectMessageType]>,
  context: { peerId: PeerId; connection: Connection },
) => Promise<EffectProtocolMessage | void>;

export class Libp2pTransport implements Transport<Libp2pMethods> {
  #entity: Entity | null = null;
  #libp2p: Libp2p | null = null;

  private readonly messageHandlers = new Map<
    EffectMessageType,
    MessageHandler
  >();

  constructor(private readonly options: Libp2pInit) {
    this.options = { ...DEFAULT_LIBP2P_OPTIONS, ...options };
  }

  get libp2p(): Libp2p {
    if (!this.#libp2p) throw new Error("Libp2p node is not initialized");
    return this.#libp2p;
  }

  get entity(): Entity {
    if (!this.#entity) throw new Error("Entity not initialized");
    return this.#entity;
  }

  async initialize(entity: Entity): Promise<void> {
    this.#entity = entity;
    this.#libp2p = await this.createLibp2pNode();
    this.setupProtocolHandler();
  }

  getMethods(): Libp2pMethods {
    return {
      //TODO::properly type these.
      //@ts-ignore
      sendMessage: this.sendMessage.bind(this),
      //@ts-ignore
      onMessage: this.onMessage.bind(this),
      getPeerId: () => this.libp2p.peerId,
      getMultiAddress: () => this.libp2p.getMultiaddrs(),
      connect: (multiaddr: Multiaddr) => this.libp2p.dial(multiaddr),
      node: this.libp2p,
    };
  }

  async start(): Promise<void> {
    await this.libp2p.start();
  }

  async stop(): Promise<void> {
    await this.libp2p.stop();
  }

  // Private implementation
  private async createLibp2pNode(): Promise<Libp2p> {
    return createLibp2p({
      start: this.options.autoStart,
      ...(this.options.privateKey && { privateKey: this.options.privateKey }),
      addresses: {
        listen: this.options.listen || [],
        announce: this.options.announce || [],
      },
      connectionGater: {
        denyDialMultiaddr: async () => false,
        denyInboundConnection: async () => false,
        denyOutboundConnection: async () => false,
      },
      connectionManager: {
        //TODO::
        maxConnections: 1000, // Increase from default 300
        inboundUpgradeTimeout: 10000, // Give more time for handshake
        maxParallelDials: 100, // Default is 100
        dialTimeout: 30000, // Increase from default 30s
      },
      transports: this.options.transports,
      streamMuxers: [yamux()],
      connectionEncrypters: [noise()],
      datastore: this.options.datastore,
      services: {
        ping: ping(),
        identify: identify(),
        ...this.options.services,
      },
    });
  }

  private setupProtocolHandler(): void {
    this.libp2p.handle(
      this.entity.protocol.name,
      async ({ stream, connection }) => {
        await this.handleIncomingStream(stream, connection);
      },
      {
        runOnLimitedConnection: false,
        maxInboundStreams: 1000,
        maxOutboundStreams: 1000,
      },
    );
  }

  private async handleIncomingStream(
    stream: Stream,
    connection: Connection,
  ): Promise<void> {
    const pb = pbStream(stream).pb(this.entity.protocol.scheme);

    try {
      const message = await this.readMessage(pb);
      if (!message) return;

      const response = await this.processIncomingMessage(message, connection);
      await this.sendResponse(pb, response);
    } catch (error) {
      await this.sendErrorResponse(pb);
    } finally {
      await stream.close();
    }
  }

  private async readMessage(
    pb: MessageStream<EffectProtocolMessage, Stream>,
  ): Promise<EffectProtocolMessage | null> {
    try {
      return await pb.read();
    } catch (error) {
      console.error("Failed to read message:", error);
      return null;
    }
  }

  private async processIncomingMessage(
    message: EffectProtocolMessage,
    connection: Connection,
  ): Promise<EffectProtocolMessage | null> {
    const { type, payload } = extractMessageType(message);
    const handler = this.messageHandlers.get(type);

    if (!handler) {
      console.error("No handler for message type:", type);
      return null;
    }

    try {
      return (
        (await handler(payload, {
          peerId: connection.remotePeer,
          connection,
        })) || null
      );
    } catch (error) {
      console.error(`Handler failed for ${type}:`);
      throw new ProtocolError("HANDLER_ERROR", "something unexpected happened");
    }
  }

  private async sendResponse(
    pb: MessageStream<EffectProtocolMessage, Stream>,
    response: EffectProtocolMessage | null,
  ): Promise<void> {
    await pb.write(response || this.createAckMessage());
  }

  private createAckMessage(): EffectProtocolMessage {
    return {
      ack: { timestamp: Math.floor(Date.now() / 1000) },
    };
  }

  private async sendErrorResponse(
    pb: MessageStream<EffectProtocolMessage, Stream>,
  ): Promise<void> {
    try {
      await pb.write({
        error: {
          timestamp: Math.floor(Date.now() / 1000),
          code: "500",
          message: "Internal server error",
        },
      });
    } catch (error) {
      console.error("Failed to send error response:", error);
    }
  }

  private onMessage(
    type: EffectMessageType,
    handler: MessageHandler,
  ): EntityWithTransports<[Libp2pTransport]> {
    if (this.messageHandlers.has(type)) {
      throw new Error(`Handler for ${type} already exists`);
    }
    if (!this.entity) throw new Error("Entity not initialized");

    this.messageHandlers.set(type, handler);
    return this.entity as EntityWithTransports<[Libp2pTransport]>;
  }

  private async sendMessage<T extends EffectProtocolMessage>(
    peerId: PeerId | Multiaddr,
    message: T,
    options: SendMessageOptions = {},
  ): Promise<[MessageResponse<T> | null, ProtocolError | null]> {
    const { timeout = 5000, existingStream } = options;
    const expectResponse = shouldExpectResponse(message);
    let stream: Stream | undefined;
    let shouldClose = false;

    try {
      // Prepare stream
      const streamResult = await this.prepareStream(peerId, existingStream);
      stream = streamResult.stream;
      shouldClose = streamResult.shouldClose;

      const pb = pbStream(stream).pb(EffectProtocolMessage);

      // Send message
      await pb.write(message);
      if (!expectResponse) {
        return [
          null,
          new ProtocolError(
            "UNEXPECTED_RESPONSE",
            "Received response for fire-and-forget message",
          ),
        ];
      }

      // Get response
      const response = await this.readResponseWithTimeout(pb, timeout);

      // Validate response
      if (response.error) {
        console.log("Received error response:", response.error);
        return [
          null,
          new ProtocolError(response.error.code, response.error.message),
        ];
      }

      const { payload } = extractMessageType(response);
      return [payload as MessageResponse<T>, null];
    } catch (error) {
      const protocolError =
        error instanceof ProtocolError
          ? error
          : new ProtocolError("NETWORK_ERROR", error.message);
      return [null, protocolError];
    } finally {
      if (shouldClose && stream) {
        try {
          await stream.close();
        } catch (closeError) {
          console.warn("Failed to close stream:", closeError);
        }
      }
    }
  }

  private async prepareStream(
    address: PeerId | Multiaddr,
    existingStream?: Stream,
  ): Promise<{ stream: Stream; shouldClose: boolean }> {
    if (existingStream) return { stream: existingStream, shouldClose: false };

    if (isMultiaddr(address)) {
      const connection = await this.libp2p.dial(address);
      return {
        stream: await connection.newStream(this.entity.protocol.name),
        shouldClose: true,
      };
    }

    let connection = this.libp2p.getConnections(address)[0];
    if (!connection) connection = await this.libp2p.dial(address);
    return {
      stream: await connection.newStream(this.entity.protocol.name),
      shouldClose: true,
    };
  }

  private async readResponseWithTimeout(
    pb: MessageStream<EffectProtocolMessage, Stream>,
    timeout: number,
  ): Promise<EffectProtocolMessage> {
    return Promise.race([
      pb.read(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Response timeout")), timeout),
      ),
    ]);
  }
}
export const createLibp2pTransport = (init: Libp2pInit) => {
  return new Libp2pTransport(init);
};
