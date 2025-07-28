import { Payment, type ProofRequest } from "@effectai/protobufs";
import type { PaymentStore } from "@effectai/protocol-core";

import type { PeerId, PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { ProofToProofResponseMessage, computePaymentId } from "../utils.js";

import {
  type Groth16Proof,
  type PublicSignals,
  type SignedPayment,
  generatePaymentProof,
  signPayment,
  prove,
  publicKeyToTruncatedHex,
} from "@effectai/payment";

import { ulid } from "ulid";
import type { createLogger } from "../logging.js";
import type { ManagerSettings } from "../main.js";
import type { createWorkerManager } from "./createWorkerManager";

export async function createPaymentManager({
  logger,
  paymentStore,
  publicKey,
  privateKey,
  workerManager,
  managerSettings,
}: {
  logger: ReturnType<typeof createLogger>;
  privateKey: PrivateKey;
  publicKey: string;
  paymentStore: PaymentStore;
  workerManager: ReturnType<typeof createWorkerManager>;
  managerSettings: ManagerSettings;
}) {
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
      totalEarned: state.totalEarned + BigInt(payment.amount),
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
    recipient,
    paymentAccount,
    proofs,
  }: {
    recipient: string;
    paymentAccount: string;
    proofs: {
      proof: Groth16Proof;
      publicSignals: PublicSignals;
    }[];
  }) {
    logger.log.info(
      {
        proofs: proofs.length,
        recipient,
        totalAmount: proofs.reduce(
          (acc, p) => acc + BigInt(p.publicSignals.amount),
          0n,
        ),
      },
      "Bulking payment proofs",
    );

    let minNonce: bigint | null = null;
    let maxNonce: bigint | null = null;
    let sumAmount = 0n;

    const truncatedPaymentAccount = publicKeyToTruncatedHex(
      new PublicKey(paymentAccount),
    );

    const truncatedRecipient = publicKeyToTruncatedHex(
      new PublicKey(recipient),
    );

    const isValidProofs = proofs.every(
      (proof) =>
        proof.publicSignals.recipient ===
          BigInt(`${truncatedRecipient}`).toString() &&
        proof.publicSignals.paymentAccount ===
          BigInt(`${truncatedPaymentAccount}`).toString(),
    );

    if (!isValidProofs) {
      throw new Error(
        "Invalid proofs: mismatched recipients or payment accounts",
      );
    }

    const verificationTasks = proofs.map(async (proof) => {
      const isValid = await prove({
        proof: proof.proof,
        publicSignals: proof.publicSignals,
      });

      if (!isValid)
        throw new Error(
          `Invalid proof for nonce ${proof.publicSignals.minNonce} - ${proof.publicSignals.maxNonce}`,
        );

      const currentNonce = BigInt(proof.publicSignals.minNonce);
      const currentMaxNonce = BigInt(proof.publicSignals.maxNonce);
      const currentAmount = BigInt(proof.publicSignals.amount);

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

      if (minNonce === null || maxNonce === null) {
        throw new Error(
          "No valid proofs found, cannot create temporary payments",
        );
      }

      //create 2 temporarly payments with the min and max nonce.
      const payments = [
        createPayment({
          version: 1,
          amount: sumAmount / 2n,
          recipient,
          publicKey,
          paymentAccount,
          nonce: minNonce,
        }),
        createPayment({
          version: 1,
          amount: sumAmount / 2n,
          recipient,
          publicKey,
          paymentAccount,
          nonce: maxNonce,
        }),
      ];

      //create a new proof with these payments
      const { proof, publicSignals } = await generatePaymentProof({
        paymentAccount: paymentAccount,
        publicKey,
        recipient,
        payments: await Promise.all(payments),
      });

      return ProofToProofResponseMessage(proof, publicSignals);
    } catch (error) {
      console.error("Batch verification failed:", error);
      throw error;
    }
  }

  const generatePayment = async ({
    peerId,
    amount,
    paymentAccount,
    version = 1,
    label,
  }: {
    peerId: PeerId;
    version?: number;
    amount: bigint;
    paymentAccount: PublicKey | string;
    label?: string;
  }) => {
    const peer = await workerManager.getWorker(peerId.toString());

    if (!peer) {
      throw new Error("Peer not found");
    }

    if (!paymentAccount) {
      throw new Error("Payment account is required");
    }

    if (typeof paymentAccount === "string") {
      paymentAccount = new PublicKey(paymentAccount);
    }

    const payment = await createPayment({
      recipient: peer.state.recipient,
      nonce: peer.state.nonce,
      amount,
      paymentAccount: paymentAccount.toBase58(),
      publicKey,
      version,
      label,
    });

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

  const createPayment = async ({
    recipient,
    nonce,
    amount,
    paymentAccount,
    publicKey,
    version,
    label,
  }: {
    version: number;
    amount: bigint;
    paymentAccount: string;
    publicKey: string;
    recipient: string;
    nonce: bigint;
    label?: string;
  }) => {
    const payment = Payment.decode(
      Payment.encode({
        id: ulid(),
        version,
        amount,
        recipient,
        paymentAccount,
        publicKey,
        nonce,
        label: label || "",
      }),
    );

    return await signPayment(payment, privateKey.raw.slice(0, 32));
  };

  const processProofRequest = async ({
    request,
  }: {
    request: ProofRequest;
  }) => {
    try {
      const { proof, publicSignals } = await generatePaymentProof({
        recipient: request.recipient,
        paymentAccount: request.paymentAccount,
        publicKey,
        payments: request.payments as Array<SignedPayment>,
      });

      return ProofToProofResponseMessage(proof, publicSignals);
    } catch (e) {
      logger.log.error(e, "Error generating proof");
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
