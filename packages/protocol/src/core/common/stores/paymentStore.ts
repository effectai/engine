import { Datastore, Key } from "interface-datastore";
import type { Payment } from "../../messages/effect.js";
import { createEntityStore } from "../../store.js";
import {
  stringifyWithBigInt,
  parseWithBigInt,
  objectToBytes,
} from "../../utils.js";

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

const parsePaymentRecord = (data: string): PaymentRecord => {
  const parsed = parseWithBigInt(data);

  // parse the r8 arrays inside the signatures.
  if (parsed.state.signature) {
    parsed.state.signature.R8 = {
      R8_1: objectToBytes(parsed.state.signature.R8.R8_1),
      R8_2: objectToBytes(parsed.state.signature.R8.R8_2),
    };
  }

  return {
    events: parsed.events,
    state: {
      ...parsed.state,
    },
  };
};

export const createPaymentStore = ({ datastore }: { datastore: Datastore }) => {
  const coreStore = createEntityStore<PaymentEvent, PaymentRecord>({
    datastore,
    defaultPrefix: "payments",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parsePaymentRecord(data),
  });

  const getFrom = async ({
    peerId,
    nonce,
  }: {
    peerId: string;
    nonce: number;
    limit?: number;
  }): Promise<PaymentRecord[]> => {
    const payments = [] as PaymentRecord[];

    for await (const item of datastore.query({
      prefix: `/payments/${peerId}/`,
      filters: [
        (item) => {
          const parts = item.key.toString().split("/");
          const nonceStr = parts[parts.length - 1];
          const itemNonce = Number.parseInt(nonceStr, 10);
          return itemNonce >= nonce;
        },
      ],
    })) {
      payments.push(parsePaymentRecord(new TextDecoder().decode(item.value)));
    }

    return payments;
  };

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

    await coreStore.put({ entityId, record });

    return record;
  };

  return {
    ...coreStore,
    create,
    getHighestNonce,
    getFrom,
  };
};

export type PaymentStore = ReturnType<typeof createPaymentStore>;
