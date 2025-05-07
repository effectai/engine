import type { WorkerEntity, WorkerEvents } from "../main.js";
import {
  type PaymentStore,
  type Payment,
  type ProofRequest,
  type PeerId,
  TypedEventEmitter,
  peerIdFromString,
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

    //emit event
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

  const getPayments = async ({
    prefix,
    limit = 100,
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
        //long timeout to allow for large batches
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

  return {
    createPayment,
    requestPayout,
    getPayments,
    requestPaymentProof,
    getMaxNonce,
    getPaymentsFromNonce,
  };
}
