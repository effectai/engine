import type { PeerId, PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  signPayment,
  int2hex,
  computePaymentId,
  ProofToProofResponseMessage,
} from "../utils.js";
import {
  type ProofRequest,
  type PaymentStore,
  Payment,
} from "@effectai/protocol-core";

import {
  buildEddsa,
  buildPoseidon,
  groth16,
  type Groth16Proof,
  type PublicSignals,
} from "@effectai/zkp";

import { PAYMENT_BATCH_SIZE } from "../consts.js";
import type { createWorkerManager } from "./createWorkerManager";
import type { ManagerSettings } from "../main.js";
import { ulid } from "ulid";
import { VerifierKeyJson } from "@effectai/zkp";
import { performance } from "node:perf_hooks";

export async function createPaymentManager({
  paymentStore,
  privateKey,
  workerManager,
  managerSettings,
}: {
  privateKey: PrivateKey;
  paymentStore: PaymentStore;
  workerManager: ReturnType<typeof createWorkerManager>;
  managerSettings: ManagerSettings;
}) {
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();

  const processPayoutRequest = async ({ peerId }: { peerId: PeerId }) => {
    const worker = await workerManager.getWorker(peerId.toString());

    if (!worker) {
      throw new Error("Worker not found");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const secondsSinceLastPayout = currentTime - worker.state.lastPayout;

    if (!managerSettings.paymentAccount) {
      throw new Error("Payment account not set, cannot process payout");
    }

    const payment = await generatePayment({
      peerId,
      amount: BigInt(secondsSinceLastPayout * 1_000_0),
      paymentAccount: new PublicKey(managerSettings.paymentAccount),
      label: `Payout for ${secondsSinceLastPayout} seconds of online time`,
    });

    //update last payout time
    await workerManager.updateWorkerState(peerId.toString(), (state) => ({
      lastPayout: currentTime,
      totalEarned: state.totalEarned + payment.amount,
    }));

    //insert payment into the store
    await paymentStore.put({
      entityId: computePaymentId(payment),
      record: {
        state: payment,
        events: [
          {
            type: "payment:created",
            timestamp: Date.now(),
          },
        ],
      },
    });

    return payment;
  };

  async function bulkPaymentProofs({
    privateKey,
    recipient,
    r8_x,
    r8_y,
    proofs,
  }: {
    privateKey: PrivateKey;
    recipient: PublicKey;
    r8_x: bigint;
    r8_y: bigint;
    proofs: {
      proof: Groth16Proof;
      publicSignals: PublicSignals;
    }[];
  }) {
    console.log("INFO: bulkPaymentProofs called with proofs:", proofs.length);

    let minNonce: bigint | null = null;
    let maxNonce: bigint | null = null;
    let sumAmount = 0n;

    const verificationTasks = proofs.map(async (proof) => {
      const isValid = await groth16.verify(
        VerifierKeyJson,
        [
          proof.publicSignals[0],
          proof.publicSignals[1],
          proof.publicSignals[2],
          proof.publicSignals[3],
          r8_x.toString(),
          r8_y.toString(),
        ],
        proof.proof,
      );

      if (!isValid)
        throw new Error(
          `Invalid proof for nonce ${proof.publicSignals[0]} - ${proof.publicSignals[1]}`,
        );

      const currentNonce = BigInt(proof.publicSignals[0]);
      const currentMaxNonce = BigInt(proof.publicSignals[1]);
      const currentAmount = BigInt(proof.publicSignals[2]);

      minNonce =
        minNonce === null
          ? currentNonce
          : currentNonce < minNonce
            ? currentNonce
            : minNonce;
      maxNonce =
        maxNonce === null
          ? currentMaxNonce
          : currentMaxNonce > maxNonce
            ? currentMaxNonce
            : maxNonce;
      sumAmount += currentAmount;
    });

    try {
      await Promise.all(verificationTasks);

      //TODO:: do some verification here on min_nonce and max nonce etc.
      const genTempPay = async ({
        amount,
        recipient,
        paymentAccount,
        nonce,
      }: {
        amount: bigint;
        recipient: string;
        paymentAccount: PublicKey;
        nonce: bigint;
      }) => {
        const payment = Payment.decode(
          Payment.encode({
            id: ulid(),
            amount,
            recipient,
            paymentAccount: paymentAccount.toBase58(),
            nonce,
            label: "temp",
          }),
        );

        const signature = await signPayment(
          payment,
          privateKey.raw.slice(0, 32),
          eddsa,
          poseidon,
        );

        payment.signature = {
          S: signature.S.toString(),
          R8: {
            R8_1: new Uint8Array(signature.R8[0]),
            R8_2: new Uint8Array(signature.R8[1]),
          },
        };

        return payment;
      };

      if (minNonce === null || maxNonce === null) {
        throw new Error(
          "No valid proofs found, cannot create temporary payments",
        );
      }

      if (!managerSettings.paymentAccount) {
        throw new Error(
          "Payment account not set, cannot create temporary payments",
        );
      }

      //create 2 temporarly payments with the min and max nonce.
      const payments = [
        genTempPay({
          amount: sumAmount / 2n,
          //TODO::extract from public signals..
          recipient: recipient.toBase58(),
          //TODO :: extract from public signals..
          paymentAccount: new PublicKey(managerSettings.paymentAccount),
          nonce: minNonce,
        }),
        genTempPay({
          amount: sumAmount / 2n,
          recipient: recipient.toBase58(),
          paymentAccount: new PublicKey(managerSettings.paymentAccount),
          nonce: maxNonce,
        }),
      ];

      //create a new proof with these payments
      const { proof, publicSignals, pubKey } = await generatePaymentProof(
        privateKey,
        await Promise.all(payments),
      );

      return ProofToProofResponseMessage(
        proof,
        publicSignals,
        pubKey[0],
        pubKey[1],
        managerSettings.paymentAccount,
      );
    } catch (error) {
      console.error("Batch verification failed:", error);
      throw error;
    }
  }

  const generatePaymentProof = async (
    privateKey: PrivateKey,
    payments: ProofRequest.PaymentProof[],
  ) => {
    //TODO:: verify & validate payments
    payments.sort((a, b) => Number(a.nonce) - Number(b.nonce));
    console.log(
      "INFO: Generating payment proof for payments:",
      payments.length,
    );
    const eddsa = await buildEddsa();
    const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));
    const batchSize = payments.length;

    if (!managerSettings.paymentAccount) {
      throw new Error("Payment account not set, cannot process payout");
    }

    //make sure the payments all have the same payment account, and it matches our payment account.
    const enabled = Array(PAYMENT_BATCH_SIZE).fill(0).fill(1, 0, batchSize);

    const padArray = <T>(arr: T[], defaultValue: T): T[] =>
      arr
        .concat(Array(PAYMENT_BATCH_SIZE - arr.length).fill(defaultValue))
        .slice(0, PAYMENT_BATCH_SIZE);

    const uniqueRecipients = new Set(payments.map((p) => p.recipient));
    // const uniquePaymentAccounts = new Set(
    //   payments.map((p) => p.paymentAccount),
    // );
    //
    if (uniqueRecipients.size > 1) {
      throw new Error("Only one type of recipient per batch is supported");
    }

    //
    // if (uniquePaymentAccounts.size > 1) {
    //   throw new Error(
    //     "Only one type of payment account per batch is supported",
    //   );
    // }

    //TODO:: check payment account..
    // const paymentAccount = uniquePaymentAccounts.values().next().value;
    const paymentAccount = managerSettings.paymentAccount;

    // //get the payment account and check if it matches our payment account.
    // if (paymentAccount !== managerSettings.paymentAccount) {
    //   throw new Error(
    //     "Payment account does not match the expected payment account",
    //   );
    // }

    const lastNonce = payments[payments.length - 1].nonce;
    const recipient = payments[0]?.recipient || "0";

    const proofInputs = {
      receiver: int2hex(new PublicKey(recipient).toBuffer().readBigUInt64BE()),
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

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const wasmPath = path.resolve(
      __dirname,
      "../../zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
    );

    const zkeyPath = path.resolve(
      __dirname,
      "../../zkp/circuits/PaymentBatch_0001.zkey",
    );

    const startTime = performance.now();
    const { publicSignals, proof } = await groth16.fullProve(
      proofInputs,
      wasmPath,
      zkeyPath,
    );
    const endTime = performance.now();
    console.log("INFO: Proof generation took:", endTime - startTime, "ms");

    return { proof, publicSignals, pubKey, paymentAccount };
  };

  const generatePayment = async ({
    peerId,
    amount,
    paymentAccount,
    label,
  }: {
    peerId: PeerId;
    amount: bigint;
    paymentAccount: PublicKey;
    label?: string;
  }) => {
    const peer = await workerManager.getWorker(peerId.toString());

    if (!peer) {
      throw new Error("Peer not found");
    }

    const payment = Payment.decode(
      Payment.encode({
        id: ulid(),
        amount,
        recipient: peer.state.recipient,
        paymentAccount: paymentAccount.toBase58(),
        nonce: peer.state.nonce,
        label: label || "",
      }),
    );

    const signature = await signPayment(
      payment,
      privateKey.raw.slice(0, 32),
      eddsa,
      poseidon,
    );

    payment.signature = {
      S: signature.S.toString(),
      R8: {
        R8_1: new Uint8Array(signature.R8[0]),
        R8_2: new Uint8Array(signature.R8[1]),
      },
    };

    //update nonce
    await workerManager.updateWorkerState(peerId.toString(), () => ({
      nonce: peer.state.nonce + BigInt(1),
    }));

    //save payment in store.
    await paymentStore.put({
      entityId: computePaymentId(payment),
      record: {
        state: payment,
        events: [
          {
            type: "payment:created",
            timestamp: Math.floor(Date.now() / 1000),
          },
        ],
      },
    });

    return payment;
  };

  const processProofRequest = async ({
    privateKey,
    payments,
  }: {
    privateKey: PrivateKey;
    payments: ProofRequest.PaymentProof[];
  }) => {
    try {
      const { proof, pubKey, publicSignals, paymentAccount } =
        await generatePaymentProof(privateKey, payments);

      return ProofToProofResponseMessage(
        proof,
        publicSignals,
        pubKey[0],
        pubKey[1],
        paymentAccount,
      );
    } catch (e) {
      console.error(e);
      throw new Error("Error generating proof");
    }
  };

  return {
    generatePayment,
    generatePaymentProof,
    processPayoutRequest,
    processProofRequest,
    bulkPaymentProofs,
  };
}
