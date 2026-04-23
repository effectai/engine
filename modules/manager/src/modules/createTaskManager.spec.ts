import { describe, it, vi, beforeEach, expect } from "vitest";
import { createTaskManager } from "./createTaskManager.js";

const mockWorkerId = "12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5";
const mockTaskId = "task-1";

const mockEventEmitter = {
  safeDispatchEvent: vi.fn(),
};

describe("createTaskManager", () => {
  let manager: any;
  let taskStore: any;
  let paymentManager: any;
  let workerManager: any;
  let taskManager: ReturnType<typeof createTaskManager>;

  beforeEach(() => {
    manager = {
      sendMessage: vi.fn().mockResolvedValue([null, null]),
    };

    workerManager = {
      selectWorker: vi.fn(() => mockWorkerId),
      markTaskAssigned: vi.fn(),
      markTaskReleased: vi.fn(),
      incrementStateValue: vi.fn(),
      setWorkerStatus: vi.fn(),
      updateWorkerState: vi.fn(),
    };

    taskStore = {
      listByStatus: vi.fn(() => []),
      assign: vi.fn(),
      reject: vi.fn(),
      payout: vi.fn(),
      getTask: vi.fn(),
      create: vi.fn(),
      accept: vi.fn(),
      complete: vi.fn(),
    };

    paymentManager = {
      generatePayment: vi.fn(() => ({
        amount: 1000,
        destination: "some-destination",
      })),
    };

    taskManager = createTaskManager({
      manager,
      workerManager,
      taskStore,
      paymentManager,
      events: mockEventEmitter,
      templateStore: { get: vi.fn(), create: vi.fn() },
      managerSettings: {
        paymentAccount: "account",
      } as any,
    });

    vi.clearAllMocks();
  });

  it("should create a task manager instance", () => {
    expect(taskManager).toBeDefined();
  });
});
