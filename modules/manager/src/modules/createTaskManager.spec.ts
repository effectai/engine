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

const recordWithEvents = (events: object[]) => ({
  state: { ...createMockTaskRecord(), repetitions: 0 },
  events,
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
      markTaskAssigned: vi.fn(),
      incrementStateValue: vi.fn(),
    };

    taskStore = {
      all: vi.fn(),
      assign: vi.fn(),
      reject: vi.fn(),
      payout: vi.fn(),
      getTask: vi.fn(),
      cancel: vi.fn(),
      requestCancel: vi.fn(),
      hasCancelRequest: vi.fn().mockResolvedValue(false),
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

  describe("cancelTask", () => {
    it("retires a task nobody holds", async () => {
      taskStore.getTask.mockResolvedValueOnce(
        recordWithEvents([{ type: "create", timestamp: 1 }]),
      );

      expect(await taskManager.cancelTask({ taskId: mockTaskId })).toBe(
        "cancelled",
      );
      expect(taskStore.cancel).toHaveBeenCalledWith({ entityId: mockTaskId });
      expect(taskStore.requestCancel).not.toHaveBeenCalled();
    });

    it("leaves a task with its worker and records the request instead", async () => {
      taskStore.getTask.mockResolvedValueOnce(
        recordWithEvents([
          { type: "create", timestamp: 1 },
          { type: "assign", timestamp: 2, assignedToPeer: mockWorkerId },
          { type: "accept", timestamp: 3, acceptedByPeer: mockWorkerId },
        ]),
      );

      expect(await taskManager.cancelTask({ taskId: mockTaskId })).toBe(
        "assigned",
      );
      expect(taskStore.cancel).not.toHaveBeenCalled();
      expect(taskStore.requestCancel).toHaveBeenCalledWith({
        entityId: mockTaskId,
      });
    });

    it("reports a task awaiting payout as submitted", async () => {
      taskStore.getTask.mockResolvedValueOnce(
        recordWithEvents([
          { type: "create", timestamp: 1 },
          { type: "assign", timestamp: 2, assignedToPeer: mockWorkerId },
          { type: "accept", timestamp: 3, acceptedByPeer: mockWorkerId },
          { type: "submission", timestamp: 4, submissionByPeer: mockWorkerId, result: "x" },
        ]),
      );

      expect(await taskManager.cancelTask({ taskId: mockTaskId })).toBe(
        "submitted",
      );
      expect(taskStore.cancel).not.toHaveBeenCalled();
    });

    it("tells cancelled from paid-out tasks in the completed index", async () => {
      // not active, completed via payout
      taskStore.getTask
        .mockRejectedValueOnce(new Error("not found"))
        .mockResolvedValueOnce(
          recordWithEvents([
            { type: "submission", timestamp: 4, submissionByPeer: mockWorkerId, result: "x" },
            { type: "payout", timestamp: 5 },
          ]),
        );
      expect(await taskManager.cancelTask({ taskId: mockTaskId })).toBe(
        "submitted",
      );

      // not active, completed via an earlier cancel
      taskStore.getTask
        .mockRejectedValueOnce(new Error("not found"))
        .mockResolvedValueOnce(
          recordWithEvents([
            { type: "create", timestamp: 1 },
            { type: "cancel", timestamp: 2 },
          ]),
        );
      expect(await taskManager.cancelTask({ taskId: mockTaskId })).toBe(
        "cancelled",
      );

      // unknown everywhere
      taskStore.getTask
        .mockRejectedValueOnce(new Error("not found"))
        .mockRejectedValueOnce(new Error("not found"));
      expect(await taskManager.cancelTask({ taskId: mockTaskId })).toBe(
        "not_found",
      );
    });
  });

  describe("assignTask", () => {
    it("retires a task with a pending cancel request instead of re-assigning it", async () => {
      taskStore.getTask.mockResolvedValueOnce(
        recordWithEvents([
          { type: "create", timestamp: 1 },
          { type: "assign", timestamp: 2, assignedToPeer: mockWorkerId },
          { type: "reject", timestamp: 3, rejectedByPeer: mockWorkerId, reason: "busy" },
        ]),
      );
      taskStore.hasCancelRequest.mockResolvedValueOnce(true);

      await taskManager.assignTask({ entityId: mockTaskId });

      expect(taskStore.cancel).toHaveBeenCalledWith({ entityId: mockTaskId });
      expect(workerManager.selectWorker).not.toHaveBeenCalled();
      expect(taskStore.assign).not.toHaveBeenCalled();
    });

    it("assigns normally when no cancel was requested", async () => {
      taskStore.getTask.mockResolvedValueOnce(
        recordWithEvents([{ type: "create", timestamp: 1 }]),
      );

      await taskManager.assignTask({ entityId: mockTaskId });

      expect(taskStore.cancel).not.toHaveBeenCalled();
      expect(taskStore.assign).toHaveBeenCalledWith({
        entityId: mockTaskId,
        workerPeerIdStr: mockWorkerId,
      });
    });
  });
});
