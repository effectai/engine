import { PublicKey } from "@solana/web3.js";
import {
  buildEddsa,
  Groth16Proof,
  PublicSignals,
  type Point,
} from "@effectai/zkp";
import type {
  EffectProtocolMessage,
  Payment,
  ProofResponse,
} from "@effectai/protocol-core";
import { createHash } from "node:crypto";

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

export function bigIntToBytes32(num: bigint): Uint8Array {
  let hex = BigInt(num).toString(16);

  hex = hex.padStart(64, "0");

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
  }
  return bytes;
}

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

export const computeTemplateId = (provider: string, template_html: string) => {
  const input = `${provider}:${template_html}`;
  const sha256 = createHash("sha256").update(input).digest("hex");
  return sha256;
};

export function proofResponseToGroth16Proof(
  proofResponse: ProofResponse,
): Groth16Proof {
  return {
    protocol: proofResponse.protocol,
    pi_a: proofResponse.piA,
    pi_b: [
      proofResponse.piB[0].row,
      proofResponse.piB[1].row,
      proofResponse.piB[2].row,
    ],
    pi_c: proofResponse.piC,
    curve: proofResponse.curve,
  };
}

export function ProofToProofResponseMessage(
  proof: Groth16Proof,
  publicSignals: PublicSignals,
  pub_x: Uint8Array,
  pub_y: Uint8Array,
  paymentAccount: string,
): EffectProtocolMessage {
  return {
    proofResponse: {
      r8: {
        R8_1: pub_x,
        R8_2: pub_y,
      },
      signals: {
        minNonce: publicSignals[0],
        maxNonce: publicSignals[1],
        amount: BigInt(publicSignals[2]),
        recipient: publicSignals[3],
        paymentAccount: paymentAccount,
      },
      piA: proof.pi_a,
      piB: [
        { row: [proof.pi_b[0][0], proof.pi_b[0][1]] },
        { row: [proof.pi_b[1][0], proof.pi_b[1][1]] },
        { row: [proof.pi_b[2][0], proof.pi_b[2][1]] },
      ],
      piC: proof.pi_c,
      protocol: proof.protocol,
      curve: proof.curve,
    },
  };
}

export const hexToPublicKey = (hexString: string) => {
  const bigIntVal = BigInt(`0x${hexString}`);

  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(bigIntVal);

  return new PublicKey(buffer);
};
