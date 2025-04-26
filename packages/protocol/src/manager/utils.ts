import type { Peer, PeerId, PeerStore } from "@libp2p/interface";
import { bigIntToUint8Array, uint8ArrayToBigInt } from "../core/utils.js";
import { PublicKey } from "@solana/web3.js";
import { buildEddsa, buildPoseidon, Point } from "circomlibjs";
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

export async function pointToCompressedPubKey(
  point: Point,
): Promise<Uint8Array> {
  const eddsa = await buildEddsa();

  const yBuf = eddsa.babyJub.F.toObject(point[1])
    .toString(16)
    .padStart(64, "0");
  const yBytes = Buffer.from(yBuf, "hex");

  const isXNegative = eddsa.babyJub.F.isNegative(point[0]);
  yBytes[31] |= isXNegative ? 0x80 : 0x00;

  return yBytes;
}

export function compressBabyJubJubPubKey(pubX: Uint8Array, pubY: Uint8Array) {
  if (pubX.length !== 32 || pubY.length !== 32) {
    throw new Error("Invalid input length — must be 32 bytes each");
  }

  const compressed = Uint8Array.from(pubY);
  const xSign = pubX[0] & 1;
  compressed[31] |= xSign << 7;

  return compressed;
}
