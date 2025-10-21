import { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE } from "./consts.js";

export const int2hex = (i: string | number | bigint | boolean) =>
  `0x${BigInt(i).toString(16)}`;

export function publicKeyToTruncatedHex(pk: PublicKey): string {
  const buffer = pk.toBuffer();
  const big = BigInt("0x" + buffer.toString("hex"));
  const shifted = big >> 3n;
  const hex = shifted.toString(16).padStart(64, "0");

  return `0x${hex}`;
}

export const padArray = <T>(arr: T[], defaultValue: T): T[] =>
  arr
    .concat(Array(PAYMENT_BATCH_SIZE - arr.length).fill(defaultValue))
    .slice(0, PAYMENT_BATCH_SIZE);

export const intStringTo32Bytes = (
  value: string | number | bigint,
): Uint8Array => {
  const hex = BigInt(value).toString(16).padStart(64, "0");

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
  }
  return bytes;
};
