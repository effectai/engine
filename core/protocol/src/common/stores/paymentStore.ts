import type { Datastore, Key } from "interface-datastore";
import { createEntityStore } from "../../store.js";
import { stringifyWithBigInt, parseWithBigInt } from "../../utils.js";
import type { Payment } from "@effectai/protobufs";
import { isValid } from "ulid";

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

  const countAmount = async ({
    peerId,
  }: {
    peerId: string;
  }): Promise<number> => {
    let amount = 0;
    for await (const item of datastore.query({
      prefix: `/payments/${peerId}/`,
    })) {
      amount += Number.parseFloat(
        parsePaymentRecord(
          new TextDecoder().decode(item.value),
        ).state.amount.toString(),
      );
    }
    return amount;
  };

  const getFrom = async ({
    peerId,
    publicKey,
    recipient,
    nonce,
  }: {
    peerId: string;
    publicKey: string;
    recipient: string;
    nonce: number;
    limit?: number;
  }): Promise<PaymentRecord[]> => {
    const payments = [] as PaymentRecord[];

    for await (const item of datastore.query({
      prefix: `/payments/${peerId}/${publicKey}/${recipient}/`,
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
    recipient,
    managerPublicKey,
  }: {
    peerId: string;
    recipient: string;
    managerPublicKey: string;
  }): Promise<bigint> => {
    const prefix = `/payments/${peerId}/${managerPublicKey}/${recipient}/`;

    const getNonce = (key: Key): bigint => {
      const parts = key.toString().split("/");
      const nonceStr = parts[parts.length - 1];
      return BigInt(nonceStr);
    };

    const numericDesc = (a: Key, b: Key): -1 | 0 | 1 => {
      const aVal = getNonce(a);
      const bVal = getNonce(b);

      if (aVal > bVal) return -1;
      if (aVal < bVal) return 1;

      return 0;
    };

    let highestNonce = 0n;
    for await (const key of datastore.queryKeys({
      prefix,
      orders: [numericDesc],
    })) {
      return getNonce(key);
    }

    return highestNonce;
  };

  const computeEntityId = (peerId: string, payment: Payment) => {
    if (!payment.signature || !payment.signature.R8) {
      throw new Error("Payment signature is required");
    }

    return `${peerId}/${payment.publicKey}/${payment.recipient}/${payment.nonce}`;
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

    if (!isValid(payment.id)) {
      throw new Error("Payment id is not a valid ulid");
    }

    const entityId = computeEntityId(peerId, payment);
    await coreStore.put({ entityId, record });

    return record;
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
    return await coreStore.paginatedQuery({
      prefix,
      page,
      perPage,
    });
  };

  return {
    ...coreStore,
    create,
    getHighestNonce,
    getFrom,
    countAmount,
    getPaginatedPayments,
  };
};

export type PaymentStore = ReturnType<typeof createPaymentStore>;
