import type { Datastore, Key } from "interface-datastore";
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

export const createPaymentStore = ({ datastore }: { datastore: Datastore }) => {
  const coreStore = createEntityStore<PaymentEvent, PaymentRecord>({
    datastore,
    defaultPrefix: "payments",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const getHighestNonce = async ({
    peerId,
  }: {
    peerId: string;
  }): Promise<number> => {
    const prefix = `/payments/${peerId}/`;

    const numericDesc = (a: Key, b: Key): -1 | 0 | 1 => {
      const getNonce = (key: Key): number => {
        const parts = key.toString().split("/");
        const nonceStr = parts[parts.length - 1];
        return Number.parseInt(nonceStr, 10) || 0;
      };

      const aVal = getNonce(a);
      const bVal = getNonce(b);

      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;

      return 0;
    };

    let highestNonce = 0;
    for await (const key of datastore.queryKeys({
      prefix,
      orders: [numericDesc],
      limit: 100,
    })) {
      const parts = key.toString().split("/");
      const nonce = Number.parseInt(parts[parts.length - 1], 10);
      return nonce;
    }

    return highestNonce;
  };

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
    console.log(`Creating payment record for ${entityId}:`, record);

    await coreStore.put({ entityId, record });

    return record;
  };

  return {
    ...coreStore,
    create,
    getHighestNonce,
  };
};

export type PaymentStore = ReturnType<typeof createPaymentStore>;
