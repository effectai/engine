import type { WorkerEntity, WorkerEvents } from "../main.js";
import {
  type PaymentStore,
  type Payment,
  type ProofRequest,
  type PeerId,
  TypedEventEmitter,
  peerIdFromString,
  ProofResponse,
  BulkProofRequest,
} from "@effectai/protocol-core";

export function createPaymentWorker({
  paymentStore,
  entity,
  events,
}: {
  paymentStore: PaymentStore;
  entity: WorkerEntity;
  events: TypedEventEmitter<WorkerEvents>;
}) {
  const createPayment = async ({
    payment,
    managerPeerId,
  }: {
    payment: Payment;
    managerPeerId: PeerId;
  }) => {
    await paymentStore.create({ peerId: managerPeerId.toString(), payment });

    events.safeDispatchEvent("payment:created", { detail: payment });

    return payment;
  };

  const getPaymentsFromNonce = async ({
    nonce,
    peerId,
  }: {
    nonce: number;
    peerId: string;
  }) => {
    const payments = await paymentStore.getFrom({
      peerId,
      nonce,
    });

    return payments;
  };

  const getPaginatedPayments = async ({
    perPage,
    page,
    prefix,
  }: {
    perPage: number;
    page: number;
    prefix?: string;
  }) => {
    return await paymentStore.getPaginatedPayments({
      prefix,
      page,
      perPage,
    });
  };

  const getPayments = async ({
    prefix,
    limit,
  }: {
    prefix?: string;
    limit?: number;
  }) => {
    return await paymentStore.all({
      prefix,
      limit,
    });
  };

  const requestPayout = async ({
    managerPeerIdStr,
  }: {
    managerPeerIdStr: string;
  }) => {
    const managerPeerId = peerIdFromString(managerPeerIdStr);

    const requestPayoutMessage = {
      payoutRequest: {
        peerId: entity.getPeerId().toString(),
      },
    };

    const [payment, error] = await entity.sendMessage(
      managerPeerId,
      requestPayoutMessage,
    );

    if (!payment || error) {
      throw new Error(`Error requesting payout: ${error}`);
    }

    await createPayment({ payment, managerPeerId: managerPeerId });

    return payment;
  };

  const requestPaymentProof = async (
    managerPeerIdStr: string,
    payments: Payment[],
  ) => {
    if (payments.length === 0) {
      throw new Error("No payments to request proof for");
    }

    const proofRequestMessage: ProofRequest = {
      batchSize: payments.length,
      payments,
    };

    return await entity.sendMessage(
      peerIdFromString(managerPeerIdStr),
      {
        proofRequest: {
          ...proofRequestMessage,
        },
      },
      {
        timeout: 60_000,
      },
    );
  };

  const requestBulkProofs = async (
    managerPeerIdStr: string,
    proofs: ProofResponse[],
  ) => {
    const proofRequestMessage: BulkProofRequest = {
      proofs,
    };

    return await entity.sendMessage(
      peerIdFromString(managerPeerIdStr),
      {
        bulkProofRequest: {
          ...proofRequestMessage,
        },
      },
      {
        timeout: 60_000,
      },
    );
  };

  const getMaxNonce = async ({
    managerPeerIdStr,
  }: {
    managerPeerIdStr: string;
  }) => {
    return await paymentStore.getHighestNonce({
      peerId: managerPeerIdStr,
    });
  };

  const countPaymentAmount = async ({
    managerPeerIdStr,
  }: {
    managerPeerIdStr: string;
  }) => {
    return await paymentStore.countAmount({
      peerId: managerPeerIdStr,
    });
  };

  return {
    createPayment,
    requestPayout,
    getPayments,
    getPaginatedPayments,
    requestPaymentProof,
    getMaxNonce,
    getPaymentsFromNonce,
    countPaymentAmount,
    requestBulkProofs,
  };
}
