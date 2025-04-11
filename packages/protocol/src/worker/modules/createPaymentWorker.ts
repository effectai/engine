import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import type { WorkerTaskStore } from "../stores/workerTaskStore.js";
import type { WorkerEntity, WorkerEvents } from "../main.js";
import type { PaymentStore } from "../../core/common/stores/paymentStore.js";
import { Payment, ProofRequest } from "../../core/messages/effect.js";
import { objectToBytes } from "../../core/utils.js";

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

  const getPayments = async () => {
    return await paymentStore.all();
  };

  const requestPayout = async ({
    managerPeer,
  }: {
    managerPeer: PeerId;
  }) => {
    const requestPayoutMessage = {
      payoutRequest: {
        peerId: entity.getPeerId().toString(),
      },
    };

    const [payment, error] = await entity.sendMessage(
      managerPeer,
      requestPayoutMessage,
    );

    if (!payment || error) {
      throw new Error(`Error requesting payout: ${error}`);
    }

    await createPayment({ payment, managerPeerId: managerPeer });

    return payment;
  };

  const requestPaymentProof = async (
    managerPeerId: PeerId,
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

    return await entity.sendMessage(managerPeerId, {
      proofRequest: {
        ...proofRequestMessage,
      },
    });
  };

  return {
    createPayment,
    requestPayout,
    getPayments,
    requestPaymentProof,
  };
}
