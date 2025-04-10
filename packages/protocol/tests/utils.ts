import type { TypedEventEmitter } from "@libp2p/interface";
import { LevelDatastore } from "datastore-level";

import { vi } from "vitest";
import type { ManagerEvents } from "../src/manager/main";
import type { WorkerEvents } from "../src/worker/main";
import { Key } from "interface-datastore";
import { Template } from "../src/core/messages/effect";
import { computeTemplateId } from "../src/core/utils";

export const createDataStore = async (path: string) => {
  const datastore = new LevelDatastore(path);
  await datastore.open();
  return datastore;
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitForEvent = async (
  mockFn: vi.Mock,
  timeout = 5000,
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (mockFn.mock.calls.length > 0) return;
    await delay(100);
  }
  throw new Error(`Timeout waiting for event after ${timeout}ms`);
};
type EventTracker = Record<string, ReturnType<typeof vi.fn>>;

export function trackWorkerEvents(worker: {
  events: TypedEventEmitter<WorkerEvents>;
}) {
  const events = {
    taskCreated: vi.fn(),
    taskAccepted: vi.fn(),
    taskCompleted: vi.fn(),
    paymentReceived: vi.fn(),
  };

  worker.events.addEventListener("task:created", events.taskCreated);
  worker.events.addEventListener("task:accepted", events.taskAccepted);
  worker.events.addEventListener("payment:created", events.paymentReceived);

  return events;
}

export function trackManagerEvents(manager: {
  events: TypedEventEmitter<ManagerEvents>;
}) {
  const events = {
    taskCreated: vi.fn(),
    taskAssigned: vi.fn(),
    taskAccepted: vi.fn(),
    taskSubmitted: vi.fn(),
    taskCompleted: vi.fn(),
  };

  manager.events.addEventListener("task:accepted", events.taskAccepted);
  manager.events.addEventListener("task:submission", events.taskSubmitted);
  manager.events.addEventListener("task:completed", events.taskCompleted);

  return events;
}

export const createMockDatastore = () => {
  const store = new Map<string, Buffer>();

  return {
    has: vi.fn(async (key: Key) => store.has(key.toString())),
    get: vi.fn(async (key: Key) => {
      const val = store.get(key.toString());
      if (!val) throw new Error("Not found");
      return val;
    }),
    put: vi.fn(async (key: Key, val: Buffer) => {
      store.set(key.toString(), val);
      return key;
    }),
    delete: vi.fn(async (key: Key) => {
      store.delete(key.toString());
    }),
    query: vi.fn(async function* () {
      for (const [key, value] of store.entries()) {
        yield { key, value };
      }
    }),
    _raw: store, // expose for inspection if needed
  };
};

export const createDummyTemplate = (providerPeerIdStr: string) => {
  const templateHtml =
    "<html><body><h1>Test Template with test variable: {{test}} </h1></body></html>";
  const templateId = computeTemplateId(providerPeerIdStr, templateHtml);
  const template: Template = {
    templateId,
    data: templateHtml,
    createdAt: Math.floor(Date.now() / 1000),
  };
  return { template, templateId };
};
