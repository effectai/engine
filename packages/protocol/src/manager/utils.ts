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
  // Ed25519 standard compression:
  // Store Y coordinate and use LSB to indicate X's sign
  const yBuf = eddsa.babyJub.F.toObject(point[1])
    .toString(16)
    .padStart(64, "0");
  const yBytes = Buffer.from(yBuf, "hex");

  // Set most significant bit of Y based on X's sign
  const isXNegative = eddsa.babyJub.F.isNegative(point[0]);
  yBytes[31] |= isXNegative ? 0x80 : 0x00;

  return yBytes;
}
