import { describe, expect, it, beforeEach, vi } from "vitest";
import { createManagerTaskStore } from "./managerTaskStore.js";

import {
  type Datastore,
  Key,
  TaskValidationError,
  TaskExpiredError,
  stringifyWithBigInt,
} from "@effectai/protocol-core";
import type { Task } from "@effectai/protobufs";

const createInMemoryDatastore = (): Datastore => {
  const store = new Map<string, Uint8Array>();

  return {
    has: vi.fn(async (key: Key) => store.has(key.toString())),
    get: vi.fn(async (key: Key) => {
      const value = store.get(key.toString());
      if (!value) throw new Error("not found");
      return value;
    }),
    put: vi.fn(async (key: Key, value: Uint8Array) => {
      store.set(key.toString(), value);
      return key;
    }),
    delete: vi.fn(async (key: Key) => {
      store.delete(key.toString());
    }),
    query: vi.fn(),
    queryKeys: async function* ({ prefix }: { prefix: string }) {
      for (const k of store.keys()) {
        if (k.startsWith(prefix)) {
          yield new Key(k);
        }
      }
    },
    batch: vi.fn(() => {
      const puts: Array<[Key, Uint8Array]> = [];
      const deletes: Key[] = [];
      return {
        put: (key: Key, value: Uint8Array) => {
          puts.push([key, value]);
        },
        delete: (key: Key) => {
          deletes.push(key);
        },
        commit: async () => {
          for (const [key, value] of puts) {
            store.set(key.toString(), value);
          }
          for (const key of deletes) {
            store.delete(key.toString());
          }
        },
      };
    }),
  } as unknown as Datastore;
};

const mockTask: Task = {
  id: "01HZZZ0JXH5X6Y8E9Z3QTK1Q6P",
  title: "Test Task",
  reward: 100n,
  timeLimitSeconds: 60,
  templateId: "template123",
  templateData: "{}",
};

describe("ManagerTaskStore", () => {
  let datastore: Datastore;
  let taskStore: ReturnType<typeof createManagerTaskStore>;

  beforeEach(() => {
    datastore = createInMemoryDatastore();
    taskStore = createManagerTaskStore({
      datastore,
    });
  });

  it("creates and indexes a task", async () => {
    const record = await taskStore.create({
      task: mockTask,
      providerPeerIdStr: "peer-1",
    });

    expect(record.state.status).toBe("created");

    const stored = await datastore.get(new Key(`/tasks/state/${mockTask.id}`));
    const parsed = JSON.parse(Buffer.from(stored).toString()) as any;
    expect(parsed.state.id).toBe(mockTask.id);
  });

  it("assigns, accepts, completes, and pays out a task", async () => {
    await taskStore.create({
      task: mockTask,
      providerPeerIdStr: "peer-1",
    });

    await taskStore.assign({
      entityId: mockTask.id,
      workerPeerIdStr: "worker-1",
    });

    const accepted = await taskStore.accept({
      entityId: mockTask.id,
      peerIdStr: "worker-1",
    });
    expect(accepted.state.status).toBe("accepted");

    const submitted = await taskStore.complete({
      entityId: mockTask.id,
      peerIdStr: "worker-1",
      result: "ok",
    });
    expect(submitted.state.status).toBe("submitted");

    const payout = await taskStore.payout({
      entityId: mockTask.id,
      payment: {
        id: "payment-1",
        version: 1,
        amount: 100n,
        recipient: "recipient",
        paymentAccount: "account",
        publicKey: "pub",
        nonce: 1n,
        label: "",
      },
    });
    expect(payout.state.status).toBe("completed");
  });

  it("rejects invalid transitions", async () => {
    await taskStore.create({
      task: mockTask,
      providerPeerIdStr: "peer-1",
    });

    await expect(
      taskStore.accept({
        entityId: mockTask.id,
        peerIdStr: "worker-1",
      }),
    ).rejects.toThrow(TaskValidationError);
  });

  it("rejects expired acceptance", async () => {
    await taskStore.create({
      task: { ...mockTask, timeLimitSeconds: 1 },
      providerPeerIdStr: "peer-1",
    });

    await taskStore.assign({
      entityId: mockTask.id,
      workerPeerIdStr: "worker-1",
    });

    // force expiration by manipulating stored state
    const stored = await datastore.get(new Key(`/tasks/state/${mockTask.id}`));
    const parsed = JSON.parse(Buffer.from(stored).toString()) as any;
    parsed.state.acceptanceDeadline = Math.floor(Date.now() / 1000) - 1;
    await datastore.put(
      new Key(`/tasks/state/${mockTask.id}`),
      Buffer.from(stringifyWithBigInt(parsed)),
    );

    await expect(
      taskStore.accept({
        entityId: mockTask.id,
        peerIdStr: "worker-1",
      }),
    ).rejects.toThrow(TaskExpiredError);
  });
});
