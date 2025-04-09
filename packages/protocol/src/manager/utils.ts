import type { Peer } from "@libp2p/interface";
import {
  computeTaskProvider,
  computeTaskId,
  bigIntToUint8Array,
  uint8ArrayToBigInt,
} from "../core/utils.js";
import { PublicKey } from "@solana/web3.js";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { TaskRecord } from "../core/common/types.js";
import { Payment } from "../core/messages/effect.js";

export const computeTaskIdFromTaskRecord = (task: TaskRecord) => {
  const provider = computeTaskProvider(task);

  if (!provider) {
    throw new Error("Task provider not found");
  }

  return computeTaskId(provider, task.state.templateData);
};

export const canCompleteTask = (record: TaskRecord) => {
  const lastEvent = record.events[record.events.length - 1];

  if (lastEvent.type !== "accept") return false;
  if (record.events.some((e) => e.type === "complete")) return false;

  // Check if expired? Add logic here.

  return true;
};

export const getNonce = ({ peer }: { peer: Peer }) => {
  const result = peer.metadata.get("session:nonce");

  if (!result) {
    throw Error("no valid nonce found..");
  }

  return BigInt(new TextDecoder().decode(result).replace(/n$/, ""));
};

export const updateNonce = ({ nonce, peer }: { nonce: bigint; peer: Peer }) => {
  peer.metadata.set("session:nonce", bigIntToUint8Array(nonce));
  return true;
};

export const getRecipient = ({ peer }: { peer: Peer }): string => {
  const result = peer.metadata.get("session:recipient");

  if (!result) {
    throw Error("no valid recipient found..");
  }

  return new TextDecoder().decode(result);
};

export const getSessionData = async (peer: Peer) => {
  const nonce = peer.metadata.get("nonce");
  const recipient = peer.metadata.get("recipient");

  if (!recipient) {
    throw new Error(`No recipient found for peerId: ${peer.id}`);
  }

  const lastPayoutTimestamp = peer.metadata.get("timeSinceLastPayout");

  if (!lastPayoutTimestamp) {
    throw new Error(`No lastPayoutTimestamp found for peerId: ${peer.id}`);
  }

  return {
    nonce: nonce ? uint8ArrayToBigInt(new Uint8Array(nonce)) : BigInt(0),
    recipient: new PublicKey(recipient),
    lastPayoutTimestamp: Number.parseInt(
      new TextDecoder().decode(lastPayoutTimestamp),
    ),
  };
};

export const signPayment = async (payment: Payment, privateKey: Uint8Array) => {
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();

  const signature = eddsa.signPoseidon(
    privateKey,
    poseidon([
      int2hex(payment.nonce.toString()),
      int2hex(new PublicKey(payment.recipient).toBuffer().readBigUInt64BE()),
      int2hex(payment.amount),
    ]),
  );

  return signature;
};

export const int2hex = (i: string | number | bigint | boolean) =>
  `0x${BigInt(i).toString(16)}`;
