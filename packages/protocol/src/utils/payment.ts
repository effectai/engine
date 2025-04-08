import type { Ed25519PrivateKey, PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { Payment } from "../common/index.js";
import { buildEddsa, buildPoseidon } from "circomlibjs";

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
