import type { Groth16Proof, PublicSignals } from "@effectai/payment";
import type { EffectProtocolMessage, ProofResponse } from "@effectai/protobufs";
import { PublicKey } from "@solana/web3.js";
import { createHash } from "node:crypto";

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
): EffectProtocolMessage {
  return {
    proofResponse: {
      signals: {
        minNonce: publicSignals.minNonce,
        maxNonce: publicSignals.maxNonce,
        amount: publicSignals.amount,
        recipient: publicSignals.recipient,
        paymentAccount: publicSignals.paymentAccount,
        pubX: publicSignals.pubX,
        pubY: publicSignals.pubY,
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
