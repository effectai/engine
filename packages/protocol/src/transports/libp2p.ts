import { createLibp2p, ServiceFactoryMap } from "libp2p";
import type { Entity, Transport } from "../core/types.js";
import { webSockets } from "@libp2p/websockets";
import { yamux } from "@chainsafe/libp2p-yamux";
import { noise } from "@chainsafe/libp2p-noise";
import { bootstrap } from "@libp2p/bootstrap";
import { ping } from "@libp2p/ping";
import { identify } from "@libp2p/identify";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import type {
	Libp2p,
	PrivateKey,
	Transport as InternalLibp2pTransport,
	IdentifyResult,
	PeerId,
	Stream,
	Connection,
	PeerStore,
} from "@libp2p/interface";
import { TransportManager } from "@libp2p/interface-internal";

import type { Components } from "@libp2p";
import { Multiaddr } from "@multiformats/multiaddr";
import { SessionService } from "../common/SessionService.js";
import { EntityWithTransports } from "../entity/types.js";
import { EffectProtocolMessage } from "../common/index.js";
import { pbStream } from "it-protobuf-stream";
import { extractMessageType } from "../utils/utils.js";
type EffectMessageType = keyof EffectProtocolMessage;

interface Libp2pMethods {
	sendMessage(peerId: PeerId, message: EffectProtocolMessage): void;
	onMessage<T extends EffectMessageType>(
		type: T,
		handler: (
			payload: NonNullable<EffectProtocolMessage[T]>,
			context: { peerId: PeerId; connection: Connection },
		) => Promise<void>,
	): EntityWithTransports<[Libp2pTransport]>;
	onIdentify(
		handler: (peerId: PeerId, identity: IdentifyResult) => Promise<void>,
	): void;
	getPeerId(): PeerId;
	getMultiAddress(): Multiaddr;
	dialProtocol(): void;
	getNode(): Libp2p;
}

export interface Libp2pInit {
	listen: string[];
	transports: ((components: Components) => InternalLibp2pTransport)[];
	bootstrap?: string[];
	privateKey?: PrivateKey;
	autoStart?: boolean;
	services?: ServiceFactoryMap;
	protocol: {
		name: "/effectai/1.0.0";
		scheme: typeof EffectProtocolMessage;
	};
	onConnect?: ({
		sessionService,
		peerId,
		connection,
		peerStore,
	}: {
		sessionService: SessionService;
		peerId: PeerId;
		connection: Connection;
		peerStore: PeerStore;
	}) => void;
	metadata?: ConnectionMetadata;
}

const DEFAULT_LIBP2P_OPTIONS: Partial<Libp2pInit> = {
	autoStart: true,
	bootstrap: [],
};

export interface ConnectionMetadata {
	[key: string]: string | number | boolean | Uint8Array;
}

export class Libp2pTransport implements Transport<Libp2pMethods> {
	private entity?: Entity;
	private readonly metadata: ConnectionMetadata;
	private readonly messageHandlers: Map<
		EffectMessageType,
		(
			payload: NonNullable<EffectProtocolMessage[EffectMessageType]>,
			{ peerId, connection }: { peerId: PeerId; connection: Connection },
		) => any
	> = new Map();

	#node: Libp2p | null = null;

	get node() {
		return this.#node;
	}

	constructor(private readonly options: Libp2pInit) {
		this.options = { ...DEFAULT_LIBP2P_OPTIONS, ...options };
		this.metadata = options.metadata || {};
	}

	async initialize(entity: Entity) {
		this.entity = entity;

		//create a libp2p node
		const libp2p = await createLibp2p({
			start: this.options.autoStart,
			...(this.options.privateKey && { privateKey: this.options.privateKey }),
			addresses: {
				listen: this.options.listen || [],
			},
			connectionGater: {
				denyDialMultiaddr: () => false,
			},
			transports: this.options.transports,
			streamMuxers: [yamux()],
			connectionEncrypters: [noise()],
			peerDiscovery: [
				...(this.options.bootstrap && this.options.bootstrap.length > 0
					? [bootstrap({ list: this.options.bootstrap })]
					: []),
			],
			services: {
				ping: ping(),
				identify: identify(),
				...this.options.services,
			},
		});

		this.#node = libp2p;

		this.#node.handle(
			this.options.protocol.name,
			async ({ stream, connection }) => {
				const pb = pbStream(stream).pb(this.options.protocol.scheme);

				const message = await pb.read();
				if (!message) {
					return;
				}

				const { type, payload } = extractMessageType(message);
				const handler = this.messageHandlers.get(type);

				if (!handler) {
					console.error("No handler for message type:", type);
					return;
				}

				if (handler) {
					await handler(payload, {
						peerId: connection.remotePeer,
						connection,
					});
				}
			},
		);

		this.#node.register(this.options.protocol.name, {
			onConnect: (peerId, conn) => {
				try {
					this.options.onConnect?.(
						this.node?.services.session as SessionService,
						peerId,
						conn,
					);
				} catch (e) {
					//if onConnect fails or throws, we should disconnect.
					console.error("onConnect failed:", e);
				}
			},
		});

		this.#node.addEventListener("peer:identify", (event) => {
			const { detail } = event;
			this.onIdentify(detail.peerId, detail);
		});

		console.log("init finish");
	}

	getMultiAddress() {
		if (this.#node) {
			return this.#node.getMultiaddrs();
		}
		return [];
	}

	getPeerId() {
		return this.#node?.peerId;
	}

	async start() {
		if (this.#node) {
			await this.#node.start();
		}
	}

	async stop() {
		if (this.#node) {
			await this.#node.stop();
		}
	}

	getNode() {
		return this.#node;
	}

	getMethods(): Libp2pMethods {
		return {
			sendMessage: this.sendMessage.bind(this),
			onMessage: this.onMessage.bind(this),
			getPeerId: this.getPeerId.bind(this),
			onIdentify: this.onIdentify.bind(this),
			getMultiAddress: this.getMultiAddress.bind(this),
			getNode: () => this.node,
		};
	}

	private async onIdentify(peerId: PeerId, identity: IdentifyResult) {
		// console.log("Peer identified:", peerId.toString(), identity);
	}

	private onMessage(type: EffectMessageType, handler: any) {
		if (this.messageHandlers.has(type)) {
			throw new Error(`Handler for ${type} already exists`);
		}

		this.messageHandlers.set(type, handler);
		return this.entity;
	}

	private async sendMessage(peerId: PeerId, message: EffectProtocolMessage) {
		if (!this.#node) {
			console.error("Libp2p node is not initialized");
			return;
		}

		let [connection] = this.#node.getConnections();

		if (!connection) {
			console.error("No open connection found.. dialing..");
			connection = await this.#node.dial(peerId);
		}

		const stream = await connection.newStream(this.options.protocol.name);

		const pb = pbStream(stream).pb(EffectProtocolMessage);

		await pb.write(message);
	}
}

export const createLibp2pTransport = (init: Libp2pInit) => {
	return new Libp2pTransport(init);
};
