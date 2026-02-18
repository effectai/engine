import {
  type Datastore,
  createEntityStore,
  stringifyWithBigInt,
  parseWithBigInt,
  Key,
} from "@effectai/protocol-core";
import type { Payment } from "@effectai/protobufs";
import { computePaymentId } from "../utils.js";

export type PaymentStatus = "created" | "proofed" | "sent" | "failed";

export interface PaymentEvent {
  type: "create" | "status";
  timestamp: number;
  status?: PaymentStatus;
}

export interface ManagerPaymentState {
  payment: Payment;
  workerId: string;
  taskId?: string;
  status: PaymentStatus;
}

export interface ManagerPaymentRecord {
  events: PaymentEvent[];
  state: ManagerPaymentState;
}

export const createManagerPaymentStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<PaymentEvent, ManagerPaymentRecord>({
    datastore,
    defaultPrefix: "payments",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const putPayment = async ({
    payment,
    workerId,
    taskId,
    status = "created",
  }: {
    payment: Payment;
    workerId: string;
    taskId?: string;
    status?: PaymentStatus;
  }) => {
    const paymentId = computePaymentId(payment);
    const record: ManagerPaymentRecord = {
      state: {
        payment,
        workerId,
        taskId,
        status,
      },
      events: [
        {
          type: "create",
          timestamp: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const batch = datastore.batch();

    batch.put(
      new Key(`/payments/state/${paymentId}`),
      Buffer.from(stringifyWithBigInt(record)),
    );

    batch.put(new Key(`/payments/byWorker/${workerId}/${paymentId}`), new Uint8Array());

    if (taskId) {
      batch.put(new Key(`/payments/byTask/${taskId}/${paymentId}`), new Uint8Array());
    }

    batch.put(new Key(`/payments/byStatus/${status}/${paymentId}`), new Uint8Array());

    await batch.commit();

    return record;
  };

  const updateStatus = async ({
    paymentId,
    status,
  }: {
    paymentId: string;
    status: PaymentStatus;
  }) => {
    const record = await coreStore.get({ entityId: `state/${paymentId}` });

    if (!record) {
      throw new Error("Payment not found");
    }

    const previousStatus = record.state.status;
    record.state.status = status;
    record.events.push({
      type: "status",
      status,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const batch = datastore.batch();
    batch.put(
      new Key(`/payments/state/${paymentId}`),
      Buffer.from(stringifyWithBigInt(record)),
    );

    if (previousStatus !== status) {
      batch.delete(new Key(`/payments/byStatus/${previousStatus}/${paymentId}`));
      batch.put(new Key(`/payments/byStatus/${status}/${paymentId}`), new Uint8Array());
    }

    await batch.commit();
  };

  const listByWorker = async ({
    workerId,
    limit,
  }: {
    workerId: string;
    limit?: number;
  }) => {
    const payments: ManagerPaymentRecord[] = [];
    let count = 0;

    for await (const key of datastore.queryKeys({
      prefix: `/payments/byWorker/${workerId}`,
    })) {
      if (limit && count >= limit) break;

      const paymentId = key.toString().split("/").pop();
      if (!paymentId) continue;

      const record = await coreStore.get({ entityId: `state/${paymentId}` });
      if (record) {
        payments.push(record);
        count += 1;
      }
    }

    return payments;
  };

  return {
    ...coreStore,
    putPayment,
    updateStatus,
    listByWorker,
  };
};

export type ManagerPaymentStore = ReturnType<typeof createManagerPaymentStore>;
