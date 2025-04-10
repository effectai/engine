import type { Datastore } from "interface-datastore";
import type { Payment } from "../../messages/effect.js";
import { createEntityStore } from "../../store.js";
import { stringifyWithBigInt, parseWithBigInt } from "../../utils.js";

export interface PaymentEvent {
  type: string;
  timestamp: number;
  [key: string]: any;
}

export interface PaymentCreatedEvent extends PaymentEvent {
  type: "create";
  providerPeer: string;
}

export interface PaymentRecord {
  events: PaymentEvent[];
  state: Payment;
}

export const createPaymentStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<PaymentEvent, PaymentRecord>({
    datastore,
    prefix: "payments",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const create = async ({
    peerId,
    payment,
  }: {
    peerId: string;
    payment: Payment;
  }): Promise<PaymentRecord> => {
    const record: PaymentRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
        },
      ],
      state: payment,
    };

    const entityId = `${peerId}/${payment.nonce}`;
    await coreStore.put({ entityId, record });

    return record;
  };

  return {
    ...coreStore,
    create,
  };
};

export type PaymentStore = ReturnType<typeof createPaymentStore>;
