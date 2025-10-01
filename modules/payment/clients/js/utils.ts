import type { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE } from "./consts.js";
import type { Groth16Proof } from "snarkjs";

export function bigIntToBytes32(num: any) {
  let hex = BigInt(num).toString(16);

  hex = hex.padStart(64, "0");

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
  }
  return bytes;
}

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

export function concatenateUint8Arrays(arrays: any) {
  // Calculate total length
  const totalLength = arrays.reduce(
    (sum: any, arr: any) => sum + arr.length,
    0,
  );
  // Create new array with total length
  const result = new Uint8Array(totalLength);
  // Copy each array into result
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function convertProofToBytes(proof: Groth16Proof) {
  // Convert pi_a components
  const pi_a = [bigIntToBytes32(proof.pi_a[0]), bigIntToBytes32(proof.pi_a[1])];

  // Convert pi_b components (note the reversed order within pairs)
  const pi_b = [
    // First pair
    bigIntToBytes32(proof.pi_b[0][1]), // Reversed order
    bigIntToBytes32(proof.pi_b[0][0]),
    // Second pair
    bigIntToBytes32(proof.pi_b[1][1]), // Reversed order
    bigIntToBytes32(proof.pi_b[1][0]),
  ];

  // Convert pi_c components
  const pi_c = [bigIntToBytes32(proof.pi_c[0]), bigIntToBytes32(proof.pi_c[1])];

  // Concatenate all components
  const allBytes = concatenateUint8Arrays([...pi_a, ...pi_b, ...pi_c]);

  return allBytes;
}
