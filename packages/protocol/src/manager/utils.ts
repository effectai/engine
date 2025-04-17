import type { Peer, PeerId, PeerStore } from "@libp2p/interface";
import { bigIntToUint8Array, uint8ArrayToBigInt } from "../core/utils.js";
import { PublicKey } from "@solana/web3.js";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { TaskRecord } from "../core/common/types.js";
import type { Payment } from "../core/messages/effect.js";

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
