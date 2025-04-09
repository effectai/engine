import { createHash } from "node:crypto";
import { TaskRecord } from "../stores/taskStore.js";

import type {
  Ed25519PublicKey,
  IdentifyResult,
  IncomingStreamData,
  PeerId,
} from "@libp2p/interface";
import type { ConnectionManager } from "@libp2p/interface-internal";
import { Uint8ArrayList } from "uint8arraylist";
import { PublicKey } from "@solana/web3.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { EffectProtocolMessage } from "../common/index.js";

export const computeTaskId = (
  provider: string,
  template_data: string,
): string => {
  const input = `${provider}:${template_data}`;
  const sha256 = createHash("sha256").update(input).digest("hex");
  return sha256;
};

export const computePaymentId = (payment: {
  recipient: string;
  nonce: bigint;
}): string => {
  const input = `${payment.recipient}:${payment.nonce}`;
  const sha256 = createHash("sha256").update(input).digest("hex");

  return sha256;
};

export const computeTaskProvider = (taskRecord: TaskRecord) => {
  const created = taskRecord.events.find((e) => e.type === "create");
  return created?.provider;
};

export function stringifyWithBigInt(obj: any): string {
  return JSON.stringify(obj, (_, value) =>
    typeof value === "bigint" ? `${value}n` : value,
  );
}

export function parseWithBigInt(json: string): any {
  return JSON.parse(json, (_, value) => {
    if (typeof value === "string" && /^\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
}

export const LibP2pPublicKeyToSolanaPublicKey = (
  publicKey: Ed25519PublicKey,
) => {
  const extractedPubKey = publicKey.raw;
  // Ensure it's an Ed25519 key (libp2p uses a prefix, remove it)
  if (extractedPubKey[0] !== 0) {
    // Ed25519 keys have prefix 0x00 in libp2p
    return new PublicKey(extractedPubKey);
  }

  return new PublicKey(publicKey);
};

export const bigIntToUint8Array = (bigint: bigint) => {
  const array = new Uint8Array(8); // 64-bit = 8 bytes
  const view = new DataView(array.buffer);
  view.setBigUint64(0, bigint, false); // false = Big-endian (MSB first)
  return array;
};

export const uint8ArrayToBigInt = (uint8Array: Uint8Array) => {
  return new DataView(uint8Array.buffer).getBigUint64(0, false);
};

export const getOrCreateActiveOutBoundStream = async (
  peerId: string,
  connectionManager: ConnectionManager,
  protocol: string,
) => {
  const peer = peerIdFromString(peerId);

  const connections = connectionManager.getConnections(peer);

  let connection = connections.find((x) => x.status === "open");
  if (!connection) {
    connection = await connectionManager.openConnection(peer);
  }

  let stream = connection.streams.filter(
    (s) => s.status === "open" && s.metadata.effectai === true,
  )[0];

  stream = await connection.newStream(protocol);
  stream.metadata = {
    effectai: true,
  };

  return stream;
};

type EffectMessageType = keyof EffectProtocolMessage;

export function extractMessageType<T extends EffectMessageType>(
  message: EffectProtocolMessage,
): { type: T; payload: NonNullable<EffectProtocolMessage[T]> } {
  const entries = Object.entries(message) as [EffectMessageType, any][];

  const definedEntries = entries.filter(([_, value]) => value !== undefined);

  if (definedEntries.length !== 1) {
    throw new Error(
      `Message must have exactly one defined field, found ${definedEntries.length}`,
    );
  }

  const [type, payload] = definedEntries[0];

  return {
    type: type as T,
    payload,
  };
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response?.type === "error";
}

export function shouldExpectResponse(message: EffectProtocolMessage): boolean {
  return (
    "proofRequest" in message ||
    "templateRequest" in message ||
    "task" in message ||
    "taskAccepted" in message ||
    "taskRejected" in message ||
    "taskCompleted" in message ||
    "payment" in message ||
    "proofRequest" in message ||
    false
  );
}
