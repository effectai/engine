import type { TypedEventEmitter } from "@libp2p/interface";
import { LevelDatastore } from "datastore-level";
import { MockedFunction, vi } from "vitest";
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

export function trackWorkerEvents(worker: {
  events: TypedEventEmitter<WorkerEvents>;
}) {
  const events = {
    taskCreated: vi.fn(),
    taskAccepted: vi.fn(),
    taskCompleted: vi.fn(),
    paymentReceived: vi.fn(),

    filtered: {
      taskCreated: new Map<string, any[]>(),
      taskAccepted: new Map<string, any[]>(),
      taskCompleted: new Map<string, any[]>(),
      paymentReceived: new Map<string, any[]>(),
    },
  };

  worker.events.addEventListener("task:created", ({ detail }) => {
    events.taskCreated({ detail });
    if (detail?.id) {
      events.filtered.taskCreated.set(detail.id, [detail]);
    }
  });

  worker.events.addEventListener("task:accepted", ({ detail }) => {
    events.taskAccepted({ detail });
    if (detail?.id) {
      const current = events.filtered.taskAccepted.get(detail.id) || [];
      events.filtered.taskAccepted.set(detail.id, [...current, detail]);
    }
  });

  worker.events.addEventListener("payment:created", ({ detail }) => {
    events.paymentReceived({ detail });
  });

  return events;
}

export function trackManagerEvents(manager: {
  events: TypedEventEmitter<ManagerEvents>;
}) {
  const events = {
    taskCreated: vi.fn(),
    taskAccepted: vi.fn(),
    taskSubmission: vi.fn(),
    taskCompleted: vi.fn(),
    paymentReceived: vi.fn(),

    filtered: {
      taskCreated: new Map<string, any[]>(),
      taskAccepted: new Map<string, any[]>(),
      taskSubmission: new Map<string, any[]>(),
      taskCompleted: new Map<string, any[]>(),
    },
  };

  manager.events.addEventListener("task:created", ({ detail }) => {
    events.taskCreated({ detail });
    if (detail?.id) {
      events.filtered.taskCreated.set(detail.id, [detail]);
    }
  });

  manager.events.addEventListener("task:accepted", ({ detail }) => {
    events.taskAccepted({ detail });
    if (detail?.state.id) {
      const current = events.filtered.taskAccepted.get(detail.state.id) || [];
      events.filtered.taskAccepted.set(detail.state.id, [...current, detail]);
    }
  });

  manager.events.addEventListener("task:submission", ({ detail }) => {
    events.taskSubmission({ detail });
    if (detail?.state.id) {
      const current = events.filtered.taskSubmission.get(detail.state.id) || [];
      events.filtered.taskSubmission.set(detail.state.id, [...current, detail]);
    }
  });

  manager.events.addEventListener("task:completed", ({ detail }) => {
    events.taskCompleted({ detail });
    if (detail?.state.id) {
      const current = events.filtered.taskCompleted.get(detail.state.id) || [];
      events.filtered.taskCompleted.set(detail.state.id, [...current, detail]);
    }
  });

  return {
    ...events,
    getTaskEvents: (taskId: string) => ({
      created: events.filtered.taskCreated.get(taskId) || [],
      accepted: events.filtered.taskAccepted.get(taskId) || [],
    }),
  };
}

export const waitForTaskEvent = (taskId: string, map: Map<string, any[]>) => {
  return new Promise((resolve) => {
    const check = () => {
      const contains = map.has(taskId);

      if (contains) {
        resolve(map.get(taskId));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
};

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
    queryKeys: vi.fn(async function* () {
      for (const key of store.keys()) {
        yield new Key(key);
      }
    }),
    _raw: store, // expose for inspection if needed
  };
};

export const createDummyTemplate = (providerPeerIdStr: string) => {
  const templateHtml =
    "<html><body><h1>Test Template with test variable: ${test}</h1></body></html>";

  const templateId = computeTemplateId(providerPeerIdStr, templateHtml);
  const template: Template = {
    templateId,
    data: templateHtml,
    createdAt: Math.floor(Date.now() / 1000),
  };
  return { template, templateId };
};
