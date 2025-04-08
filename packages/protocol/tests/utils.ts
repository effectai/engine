import { TypedEventEmitter } from "@libp2p/interface";
import { LevelDatastore } from "datastore-level";

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

import { vi } from "vitest";
import { ManagerEvents } from "../src/manager/main";
import { WorkerEvents } from "../src/worker/main";

type EventTracker = Record<string, ReturnType<typeof vi.fn>>;

export function trackWorkerEvents(worker: {
  eventEmitter: TypedEventEmitter<WorkerEvents>;
}) {
  const events = {
    taskCreated: vi.fn(),
    taskAccepted: vi.fn(),
    taskCompleted: vi.fn(),
    paymentReceived: vi.fn(),
  };

  worker.eventEmitter.addEventListener("task:created", events.taskCreated);
  worker.eventEmitter.addEventListener("task:accepted", events.taskAccepted);
  worker.eventEmitter.addEventListener(
    "payment:created",
    events.paymentReceived,
  );

  return events;
}

export function trackManagerEvents(manager: {
  eventEmitter: TypedEventEmitter<ManagerEvents>;
}) {
  const events = {
    taskCreated: vi.fn(),
    taskAssigned: vi.fn(),
    taskAccepted: vi.fn(),
    taskSubmitted: vi.fn(),
    taskCompleted: vi.fn(),
  };

  manager.eventEmitter.addEventListener("task:accepted", events.taskAccepted);
  manager.eventEmitter.addEventListener(
    "task:submission",
    events.taskSubmitted,
  );
  manager.eventEmitter.addEventListener("task:completed", events.taskCompleted);

  return events;
}
