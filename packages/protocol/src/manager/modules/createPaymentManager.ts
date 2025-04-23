import type {
  Connection,
  PeerId,
  PeerStore,
  PrivateKey,
} from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { fileURLToPath } from "node:url";
import * as snarkjs from "snarkjs";
import path from "node:path";
import { signPayment, int2hex } from "../utils.js";
import {
  type ProofRequest,
  type EffectProtocolMessage,
  Payment,
} from "../../core/messages/effect.js";
import { computePaymentId } from "../../core/utils.js";
import type { PaymentStore } from "../../core/common/stores/paymentStore.js";
import { createWorkerManager } from "./createWorkerManager.js";

export async function createPaymentManager({
  paymentStore,
  privateKey,
  workerManager,
}: {
  privateKey: PrivateKey;
  paymentStore: PaymentStore;
  workerManager: ReturnType<typeof createWorkerManager>;
}) {
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();

  const processPayoutRequest = async ({
    peerId,
  }: {
    peerId: PeerId;
  }) => {
    const worker = await workerManager.getWorker(peerId.toString());

    if (!worker) {
      throw new Error("Worker not found");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const secondsSinceLastPayout = currentTime - worker.state.lastPayout;

    const payment = await generatePayment({
      peerId,
      amount: BigInt(secondsSinceLastPayout * 1_000_0),
      paymentAccount: new PublicKey(
        "8Ex7XokfTdr1MAMZXgN3e5eQWJ6H9u5KbnPC8CLcYgH5",
      ),
      label: `Payout for ${secondsSinceLastPayout} seconds of online time`,
    });

    //update last payout time
    await workerManager.updateLastPayout(peerId.toString());

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

  const generatePaymentProof = async (
    privateKey: PrivateKey,
    payments: ProofRequest.PaymentProof[],
  ) => {
    //TODO:: verify & validate payments

    payments.sort((a, b) => Number(a.nonce) - Number(b.nonce));

    const eddsa = await buildEddsa();
    const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));

    //TODO:: make this dynamic
    const maxBatchSize = 10;
    const batchSize = payments.length;

    const enabled = Array(maxBatchSize).fill(0).fill(1, 0, batchSize);

    const padArray = <T>(arr: T[], defaultValue: T): T[] =>
      arr
        .concat(Array(maxBatchSize - arr.length).fill(defaultValue))
        .slice(0, maxBatchSize);

    const uniqueRecipients = new Set(payments.map((p) => p.recipient));

    if (uniqueRecipients.size > 1) {
      throw new Error("Only one type of recipient per batch is supported");
    }

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
        0,
      ),
      R8y: padArray(
        payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_2)),
        0,
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
      "../../../../../zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
    );
    const zkeyPath = path.resolve(
      __dirname,
      "../../../../../zkp/circuits/PaymentBatch_0001.zkey",
    );

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      proofInputs,
      wasmPath,
      zkeyPath,
    );

    return { proof, publicSignals, pubKey };
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

    const payment = Payment.decode(
      Payment.encode({
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
    await workerManager.incrementNonce(peerId.toString());

    //save payment in store.
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

  const processProofRequest = async ({
    privateKey,
    peerId,
    payments,
  }: {
    privateKey: PrivateKey;
    peerId: PeerId;
    payments: ProofRequest.PaymentProof[];
  }) => {
    try {
      const { proof, pubKey, publicSignals } = await generatePaymentProof(
        privateKey,
        payments,
      );

      const proofResponse: EffectProtocolMessage = {
        proofResponse: {
          r8: {
            R8_1: pubKey[0],
            R8_2: pubKey[1],
          },
          signals: {
            minNonce: publicSignals[0],
            maxNonce: publicSignals[1],
            amount: BigInt(publicSignals[2]),
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

      return proofResponse;
    } catch (e) {
      console.error("Error generating proof", e);
      throw new Error("Error generating proof");
    }
  };

  return {
    generatePayment,
    generatePaymentProof,
    processPayoutRequest,
    processProofRequest,
  };
}
