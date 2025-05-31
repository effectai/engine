// generates a sample proof.json and public.json for testing purposes
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

export const int2hex = (i: string | number | bigint | boolean) =>
  `0x${BigInt(i).toString(16)}`;

const eddsa = await buildEddsa();
const poseidon = await buildPoseidon();

export const signPayment = async (payment: any, privateKey: Uint8Array) => {
  const signature = eddsa.signPoseidon(
    privateKey,
    poseidon([
      int2hex(payment.nonce.toString()),
      int2hex("0"),
      int2hex(payment.amount),
    ]),
  );

  return signature;
};

const PAYMENT_BATCH_SIZE = 60;

const generatePaymentProof = async (privateKey: any, payments: any) => {
  const eddsa = await buildEddsa();
  const pubKey = eddsa.prv2pub(privateKey);
  const batchSize = payments.length;

  //make sure the payments all have the same payment account, and it matches our payment account.
  const enabled = Array(PAYMENT_BATCH_SIZE).fill(0).fill(1, 0, batchSize);

  const padArray = <T>(arr: T[], defaultValue: T): T[] =>
    arr
      .concat(Array(PAYMENT_BATCH_SIZE - arr.length).fill(defaultValue))
      .slice(0, PAYMENT_BATCH_SIZE);

  const lastNonce = payments[payments.length - 1].nonce;
  const recipient = payments[0]?.recipient || "0";

  const proofInputs = {
    receiver: int2hex(recipient),
    pubX: eddsa.F.toObject(pubKey[0]),
    pubY: eddsa.F.toObject(pubKey[1]),
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
      payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_1)),
      0n,
    ),
    R8y: padArray(
      payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_2)),
      0n,
    ),
    S: padArray(
      payments.map((s) => BigInt(s.signature?.S || 0)),
      BigInt(0),
    ),
  };

  return proofInputs;
};

const generate = async () => {
  //generate n payments
  const n = 2;
  const payments = [];

  const privateKey = new Uint8Array(32).fill(1);

  for (let i = 0; i < n; i++) {
    const payment = {
      nonce: BigInt(i),
      amount: 500n,
    };

    const signature = await signPayment(payment, privateKey);

    payment.signature = {
      S: signature.S.toString(),
      R8: {
        R8_1: new Uint8Array(signature.R8[0]),
        R8_2: new Uint8Array(signature.R8[1]),
      },
    };

    payments.push(payment);
  }

  const proofInputs = await generatePaymentProof(privateKey, payments);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const wasmPath = path.resolve(
    __dirname,
    "./../circuits/PaymentBatch_js/PaymentBatch.wasm",
  );

  const zkeyPath = path.resolve(
    __dirname,
    "./../circuits/PaymentBatch_0001.zkey",
  );

  const time = performance.now();
  const { publicSignals, proof } = await groth16.fullProve(
    proofInputs,
    wasmPath,
    zkeyPath,
  );
  const endTime = performance.now();

  console.log("Proof generated in", (endTime - time).toFixed(2), "ms");

  const replacer = (key: string, value: any) =>
    typeof value === "bigint" ? value.toString() : value;

  //save proofInjputs to json file
  writeFileSync("input.json", JSON.stringify(proofInputs, replacer, 2));
};

generate();
