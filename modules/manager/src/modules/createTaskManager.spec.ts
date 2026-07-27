import { describe, it, vi, beforeEach, expect } from "vitest";
import { createTaskManager } from "./createTaskManager.js";

const mockWorkerId = "12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5";
const mockTaskId = "task-1";

const mockEventEmitter = {
  safeDispatchEvent: vi.fn(),
};

const createMockTaskRecord = (): Task => ({
  id: mockTaskId,
  title: "Test Task",
  reward: 1000n,
  templateId: "template-1",
  templateData: '{"key": "value"}',
  timeLimitSeconds: 60,
});

describe("createTaskManager", () => {
  let manager: any;
  let workerQueue: any;
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
    };

    taskStore = {
      all: vi.fn(),
      assign: vi.fn(),
      reject: vi.fn(),
      payout: vi.fn(),
      getTask: vi.fn(),
      cancel: vi.fn(),
      finalizeCancelIfRequested: vi.fn(),
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
    });

    vi.clearAllMocks();
  });

  it("should create a task manager instance", () => {});

  describe("assignTask", () => {
    it("should cancel instead of assigning when a cancel was requested", async () => {
      const taskRecord = {
        state: createMockTaskRecord(),
        events: [{ type: "reject", timestamp: 1000, reason: "busy" }],
      };
      taskStore.getTask.mockResolvedValue(taskRecord);
      taskStore.finalizeCancelIfRequested.mockResolvedValue(taskRecord);

      await taskManager.assignTask({ entityId: mockTaskId });

      expect(mockEventEmitter.safeDispatchEvent).toHaveBeenCalledWith(
        "task:cancelled",
        { detail: taskRecord },
      );
      expect(taskStore.assign).not.toHaveBeenCalled();
      expect(workerManager.selectWorker).not.toHaveBeenCalled();
    });

    it("should assign normally when no cancel was requested", async () => {
      workerManager.markTaskAssigned = vi.fn();
      workerManager.incrementStateValue = vi.fn();
      const taskRecord = {
        state: createMockTaskRecord(),
        events: [{ type: "create", timestamp: 1000, providerPeer: "provider" }],
      };
      taskStore.getTask.mockResolvedValue(taskRecord);
      taskStore.finalizeCancelIfRequested.mockResolvedValue(null);

      await taskManager.assignTask({ entityId: mockTaskId });

      expect(taskStore.assign).toHaveBeenCalledWith({
        entityId: mockTaskId,
        workerPeerIdStr: mockWorkerId,
      });
    });
  });

  describe("processTaskCancellation", () => {
    it("should dispatch task:cancelled when the cancel is immediate", async () => {
      const taskRecord = {
        state: createMockTaskRecord(),
        events: [],
      };
      taskStore.cancel.mockResolvedValue({
        status: "cancelled",
        taskRecord,
      });

      const result = await taskManager.processTaskCancellation({
        taskId: mockTaskId,
        reason: "Job cancelled by requestor",
        providerPeerIdStr: "provider",
      });

      expect(result.status).toBe("cancelled");
      expect(taskStore.cancel).toHaveBeenCalledWith({
        entityId: mockTaskId,
        peerIdStr: "provider",
        reason: "Job cancelled by requestor",
      });
      expect(mockEventEmitter.safeDispatchEvent).toHaveBeenCalledWith(
        "task:cancelled",
        { detail: taskRecord },
      );
    });

    it("should not dispatch task:cancelled when the cancel is pending", async () => {
      taskStore.cancel.mockResolvedValue({
        status: "pending",
        taskRecord: { state: createMockTaskRecord(), events: [] },
      });

      const result = await taskManager.processTaskCancellation({
        taskId: mockTaskId,
        reason: "Job cancelled by requestor",
        providerPeerIdStr: "provider",
      });

      expect(result.status).toBe("pending");
      expect(mockEventEmitter.safeDispatchEvent).not.toHaveBeenCalled();
    });
  });
});
