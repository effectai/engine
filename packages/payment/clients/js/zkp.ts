import { buildEddsa, type Eddsa } from "circomlibjs";
import { PublicKey } from "@solana/web3.js";
import { int2hex, padArray, publicKeyToTruncatedHex } from "./utils.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { groth16, type Groth16Proof } from "snarkjs";
import type { Payment } from "@effectai/protobufs";
import { PAYMENT_BATCH_SIZE } from "./consts.js";
export type { Groth16Proof } from "snarkjs";
export { buildEddsa } from "circomlibjs";

export type DeepNonNullable<T> = T extends Function
  ? T
  : T extends object
    ? { [K in keyof T]-?: DeepNonNullable<NonNullable<T[K]>> }
    : NonNullable<T>;

export type SignedPayment = Payment & {
  signature: {
    R8: {
      R8_1: string;
      R8_2: string;
    };
    S: string;
  };
};

export type PublicSignals = {
  recipient: string;
  paymentAccount: string;
  minNonce: string;
  maxNonce: string;
  amount: string;
  pubX: string;
  pubY: string;
};

let eddsa: Eddsa | null = null;

export const signPayment = async (
  payment: Payment,
  privateKey: Uint8Array,
): Promise<SignedPayment> => {
  if (!eddsa) {
    eddsa = await buildEddsa();
  }

  const signature = eddsa.signPoseidon(
    privateKey,
    eddsa.poseidon([
      int2hex(payment.nonce.toString()),
      publicKeyToTruncatedHex(new PublicKey(payment.recipient)),
      publicKeyToTruncatedHex(new PublicKey(payment.paymentAccount)),
      int2hex(payment.amount),
    ]),
  );

  return {
    ...payment,
    signature: {
      R8: {
        R8_1: eddsa.F.toObject(signature.R8[0]).toString(),
        R8_2: eddsa.F.toObject(signature.R8[1]).toString(),
      },
      S: signature.S.toString(),
    },
  } as SignedPayment;
};

export const generatePaymentProof = async ({
  publicKey,
  recipient,
  paymentAccount,
  payments,
}: {
  publicKey: string;
  recipient: string;
  paymentAccount: string;
  payments: Array<SignedPayment>;
}) => {
  try {
    if (!eddsa) {
      eddsa = await buildEddsa();
    }

    const batchSize = payments.length;
    payments.sort((a, b) => Number(a.nonce) - Number(b.nonce));

    const [pubX, pubY] = eddsa.babyJub.unpackPoint(
      new PublicKey(publicKey).toBytes(),
    );

    const enabled = Array(PAYMENT_BATCH_SIZE).fill(0).fill(1, 0, batchSize);
    const lastNonce = payments[payments.length - 1].nonce;

    const proofInputs = {
      pubX: eddsa.F.toObject(pubX),
      pubY: eddsa.F.toObject(pubY),
      receiver: publicKeyToTruncatedHex(new PublicKey(recipient)),
      paymentAccount: publicKeyToTruncatedHex(new PublicKey(paymentAccount)),
      nonce: padArray(
        payments.map((p) => int2hex(Number(p.nonce))),
        int2hex(lastNonce),
      ),
      enabled,
      payAmount: padArray(
        payments.map((p) => int2hex(p.amount)),
        "0",
      ),
      R8x: padArray(
        payments.map((s) => s.signature.R8.R8_1),
        "0",
      ),
      R8y: padArray(
        payments.map((s) => s.signature.R8.R8_2),
        "0",
      ),
      S: padArray(
        payments.map((s) => BigInt(s.signature?.S || 0)),
        BigInt(0),
      ),
    };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    let relativePath = "";
    if (__dirname.includes("dist")) {
      relativePath = path.resolve(__dirname, "./../circuits/build");
    } else {
      relativePath = path.resolve(__dirname, "./../../circuits/build");
    }

    const wasmPath = path.resolve(
      __dirname,
      relativePath,
      "PaymentBatch_js/PaymentBatch.wasm",
    );
    const zkeyPath = path.resolve(
      __dirname,
      relativePath,
      "PaymentBatch_0001.zkey",
    );

    const result = await groth16.fullProve(proofInputs, wasmPath, zkeyPath);

    return {
      proof: result.proof,
      publicSignals: {
        minNonce: result.publicSignals[0],
        maxNonce: result.publicSignals[1],
        amount: result.publicSignals[2],
        recipient: result.publicSignals[3],
        paymentAccount: result.publicSignals[4],
        pubX: result.publicSignals[5],
        pubY: result.publicSignals[6],
      } as PublicSignals,
    };
  } catch (error) {
    console.error("Error generating payment proof:", error);
    throw error;
  }
};

export const prove = async ({
  proof,
  publicSignals,
}: {
  proof: Groth16Proof;
  publicSignals: PublicSignals;
}) => {
  const PaymentBatchVerifier = await import(
    "../../circuits/build/PaymentBatch_verification.json",
    {
      assert: { type: "json" },
    }
  );

  return await groth16.verify(
    PaymentBatchVerifier,
    [...Object.values(publicSignals)],
    proof,
  );
};
