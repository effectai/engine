import { describe, it, vi, beforeEach, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { createTaskManager } from "./createTaskManager.js";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import { peerIdFromString } from "@libp2p/peer-id";

const now = Math.floor(Date.now() / 1000);
const mockWorkerId = "12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5";
const mockTaskId = "task-1";

const mockEventEmitter = {
  safeDispatchEvent: vi.fn(),
};

const createMockTaskRecord = (type: string, timestamp = now) => ({
  state: {
    id: mockTaskId,
    reward: 1000,
  },
  events: [
    {
      type,
      timestamp,
      assignedToPeer: mockWorkerId,
      completedByPeer: mockWorkerId,
      submissionByPeer: mockWorkerId,
      rejectedByPeer: "",
      reason: "",
    },
  ],
});

describe("createTaskManager", () => {
  let manager: any;
  let workerQueue: any;
  let taskStore: any;
  let paymentManager: any;
  let taskManager: ReturnType<typeof createTaskManager>;

  beforeEach(() => {
    manager = {
      sendMessage: vi.fn(),
    };

    workerQueue = {
      dequeueWorker: vi.fn(() => mockWorkerId),
    };

    taskStore = {
      all: vi.fn(),
      assign: vi.fn(),
      reject: vi.fn(),
      payout: vi.fn(),
    };

    paymentManager = {
      generatePayment: vi.fn(() => ({
        amount: 1000,
        destination: "some-destination",
      })),
    };
    taskManager = createTaskManager({
      manager,
      workerQueue,
      taskStore,
      paymentManager,
      eventEmitter: mockEventEmitter,
    });

    vi.clearAllMocks();
  });

  it("should assign task on creation", async () => {
    const task = createMockTaskRecord("create");

    await taskManager.manageTask(task);

    expect(workerQueue.dequeueWorker).toHaveBeenCalled();
    expect(taskStore.assign).toHaveBeenCalledWith({
      entityId: mockTaskId,
      workerPeerIdStr: mockWorkerId,
    });

    expect(manager.sendMessage).toHaveBeenCalledWith(
      peerIdFromString(mockWorkerId),
      {
        task: task.state,
      },
    );
  });

  it("should reject and reassign expired assigned task", async () => {
    const expiredTimestamp = now - TASK_ACCEPTANCE_TIME - 10;
    const task = createMockTaskRecord("assign", expiredTimestamp);

    taskStore.reject.mockImplementation(async ({ entityId, peerIdStr }) => {
      task.events.push({
        type: "reject",
        timestamp: Math.floor(Date.now() / 1000),
        rejectedByPeer: peerIdStr.toString(),
        reason: "Worker took too long to accept/reject task",
      });
    });

    await taskManager.manageTask(task);

    expect(taskStore.reject).toHaveBeenCalledWith({
      entityId: mockTaskId,
      peerIdStr: mockWorkerId,
      reason: "Worker took too long to accept/reject task",
    });

    expect(taskStore.assign).toHaveBeenCalled();
  });

  it("should reassign if task was accepted but expired", async () => {
    const expiredTimestamp = now - TASK_ACCEPTANCE_TIME - 10;
    const task = createMockTaskRecord("accept", expiredTimestamp);

    await taskManager.manageTask(task);

    expect(taskStore.assign).toHaveBeenCalled();
  });

  it("should generate payout and send message on submission", async () => {
    const task = createMockTaskRecord("submission");

    await taskManager.manageTask(task);

    expect(paymentManager.generatePayment).toHaveBeenCalledWith({
      peerId: peerIdFromString(mockWorkerId),
      amount: 1000,
      paymentAccount: new PublicKey(
        "796qppG6jGia39AE8KLENa2mpRp5VCtm48J8JsokmwEL",
      ),
    });

    expect(taskStore.payout).toHaveBeenCalledWith({
      entityId: mockTaskId,
      payment: expect.any(Object),
    });

    expect(manager.sendMessage).toHaveBeenCalledWith(
      peerIdFromString(mockWorkerId),
      expect.objectContaining({ payment: expect.any(Object) }),
    );
  });

  it("should do nothing for payout event type", async () => {
    const task = {
      ...createMockTaskRecord("payout"),
      events: [{ type: "payout", timestamp: now }],
    };

    await taskManager.manageTask(task);

    expect(taskStore.assign).not.toHaveBeenCalled();
    expect(manager.sendMessage).not.toHaveBeenCalled();
  });

  it("should log error if event type is unknown", async () => {
    const task = {
      ...createMockTaskRecord("unknown"),
      events: [{ type: "what-the-heck", timestamp: now }],
    };

    await taskManager.manageTask(task);

    expect(taskStore.assign).not.toHaveBeenCalled();
  });

  it("should manage all tasks in taskStore", async () => {
    taskStore.all.mockResolvedValue([
      createMockTaskRecord("create"),
      createMockTaskRecord("accept", now - TASK_ACCEPTANCE_TIME - 5),
    ]);

    await taskManager.manageTasks();

    expect(taskStore.assign).toHaveBeenCalledTimes(2);
  });

  it("should throw error if trying to assign already assigned task", async () => {
    const task = createMockTaskRecord("assign");

    await expect(taskManager.assignTask({ taskRecord: task })).rejects.toThrow(
      "Task is already assigned.",
    );
  });

  it("should handle missing available worker gracefully", async () => {
    workerQueue.dequeueWorker.mockReturnValueOnce(null);
    const task = createMockTaskRecord("create");

    await taskManager.manageTask(task);

    expect(taskStore.assign).not.toHaveBeenCalled();
  });
});
