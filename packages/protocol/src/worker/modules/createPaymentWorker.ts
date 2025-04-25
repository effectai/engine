import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import type { WorkerEntity, WorkerEvents } from "../main.js";
import type { PaymentStore } from "../../core/common/stores/paymentStore.js";
import type { Payment, ProofRequest } from "../../core/messages/effect.js";
import { objectToBytes } from "../../core/utils.js";
import { peerIdFromString } from "@libp2p/peer-id";

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
      payments: payments.map((payment) => ({
        ...payment,
        signature: {
          R8: {
            R8_1: objectToBytes(payment.signature.R8?.R8_1),
            R8_2: objectToBytes(payment.signature.R8?.R8_2),
          },
          S: payment.signature.S,
        },
      })),
    };

    return await entity.sendMessage(peerIdFromString(managerPeerIdStr), {
      proofRequest: {
        ...proofRequestMessage,
      },
    });
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
  };
}
