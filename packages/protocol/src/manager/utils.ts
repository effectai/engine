import type { Peer, PeerId, PeerStore } from "@libp2p/interface";
import { bigIntToUint8Array, uint8ArrayToBigInt } from "../core/utils.js";
import { PublicKey } from "@solana/web3.js";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { TaskRecord } from "../core/common/types.js";
import type { Payment } from "../core/messages/effect.js";

export const getNonce = ({ peer }: { peer: Peer }) => {
  const result = peer.metadata.get("nonce");

  if (!result) {
    throw Error("no valid nonce found..");
  }

  return uint8ArrayToBigInt(new Uint8Array(result));
};

export const updateNonce = async ({
  nonce,
  peerStore,
  peer,
}: { nonce: bigint; peerStore: PeerStore; peer: PeerId }) => {
  await peerStore.merge(peer, {
    metadata: {
      nonce: bigIntToUint8Array(nonce),
    },
  });
  return true;
};

export const getRecipient = ({ peer }: { peer: Peer }): string => {
  const result = peer.metadata.get("recipient");

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

  const lastPayoutTimestamp = peer.metadata.get("lastPayout");

  if (!lastPayoutTimestamp) {
    throw new Error(`No lastPayoutTimestamp found for peerId: ${peer.id}`);
  }

  return {
    nonce: nonce ? uint8ArrayToBigInt(new Uint8Array(nonce)) : BigInt(0),
    recipient: new PublicKey(new TextDecoder().decode(recipient)).toString(),
    lastPayout: Number.parseInt(new TextDecoder().decode(lastPayoutTimestamp)),
  };
};

export const signPayment = async (
  payment: Payment,
  privateKey: Uint8Array,
  eddsa: any,
  poseidon: any,
) => {
  const signature = await eddsa.signPoseidon(
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

function objectToBytes(obj: Record<string, number>): Uint8Array {
  // Get all values and sort by numeric keys
  const values = Object.entries(obj)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([_, value]) => value);

  return new Uint8Array(values);
}
