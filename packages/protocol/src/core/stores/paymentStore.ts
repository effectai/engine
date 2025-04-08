import { type Datastore, Key } from "interface-datastore";
import type { PeerId } from "@libp2p/interface";
import {
  parseWithBigInt,
  stringifyWithBigInt,
  computePaymentId,
} from "../utils.js";
import { Payment } from "../messages/effect.js";

export interface PaymentRecord {
  state: Payment;
}

export type PaymentStore = {
  all: () => Promise<PaymentRecord[]>;
  has: (args: { entityId: string }) => Promise<boolean>;
  get: (args: { entityId: string }) => Promise<PaymentRecord>;
  put: (args: { entityId: string; record: PaymentRecord }) => Promise<Key>;
  delete: (args: { entityId: string }) => Promise<void>;
  create: (args: {
    payment: Payment;
  }) => Promise<PaymentRecord>;
};

export const createPaymentStore = ({ datastore }: { datastore: Datastore }) => {
  const has = async ({ entityId }: { entityId: string }): Promise<boolean> => {
    return datastore.has(new Key(`/payments/${entityId}`));
  };

  const get = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<PaymentRecord> => {
    try {
      const data = await datastore.get(new Key(`/payments/${entityId}`));
      return parseWithBigInt(data.toString());
    } catch (e) {
      console.error("Entity not found");
      throw e;
    }
  };

  const put = async ({
    entityId,
    record,
  }: {
    entityId: string;
    record: PaymentRecord;
  }): Promise<Key> => {
    return datastore.put(
      new Key(`/payments/${entityId}`),
      Buffer.from(stringifyWithBigInt(record)),
    );
  };

  const del = async ({ entityId }: { entityId: string }): Promise<void> => {
    await datastore.delete(new Key(`/payments/${entityId}`));
  };

  const all = async (): Promise<PaymentRecord[]> => {
    const tasks: PaymentRecord[] = [];
    for await (const entry of datastore.query({})) {
      tasks.push(JSON.parse(entry.value.toString()));
    }
    return tasks;
  };

  const create = async ({
    payment,
  }: {
    payment: Payment;
  }): Promise<PaymentRecord> => {
    const record: PaymentRecord = {
      state: payment,
    };
    const entityId = computePaymentId(payment);
    await put({ entityId, record });
    return record;
  };

  return {
    has,
    get,
    put,
    delete: del,
    all,
    create,
  };
};
