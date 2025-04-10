import type { PeerId } from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createManagerTaskStore } from "./managerTaskStore.js";
import { TaskValidationError, TaskExpiredError } from "../../core/errors.js";
import { Task } from "../../core/messages/effect.js";
import { stringifyWithBigInt } from "../../core/utils.js";

const mockDatastore = {
  has: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  query: vi.fn(),
};

const mockEventEmitter = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  safeDispatchEvent: vi.fn(),
};

const mockPeerId = {
  toString: () => "peerId123",
} as PeerId;

const mockWorkerPeerId = {
  toString: () => "workerPeerId123",
} as PeerId;

const mockTask: Task = {
  id: "task123",
  title: "Test Task",
  reward: 100n,
  timeLimitSeconds: 3600,
  templateId: "template123",
  templateData: "{}",
};

describe("ManagerTaskStore", () => {
  let taskStore: ReturnType<typeof createManagerTaskStore>;

  beforeEach(() => {
    vi.resetAllMocks();
    taskStore = createManagerTaskStore({
      datastore: mockDatastore as unknown as Datastore,
    });

    mockDatastore.get.mockImplementation(async (key: Key) => {
      return Buffer.from(
        stringifyWithBigInt({
          state: mockTask,
          events: [],
        }),
      );
    });
    mockDatastore.put.mockResolvedValue(new Key("/tasks/task123"));
  });

  describe("create", () => {
    it("should create a new task record", async () => {
      const result = await taskStore.create({
        task: mockTask,
        providerPeerId: mockPeerId,
      });

      expect(result.state).toEqual(mockTask);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe("create");
      expect(mockDatastore.put).toHaveBeenCalled();
    });

    it("should include the provider peer in create event", async () => {
      const result = await taskStore.create({
        task: mockTask,
        providerPeerIdStr: mockPeerId.toString(),
      });

      expect(result.events[0].providerPeer).toBe("peerId123");
    });
  });

  describe("assign", () => {
    it("should assign task to worker when last event is create", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              {
                type: "create",
                timestamp: Math.floor(Date.now() / 1000),
                providerPeer: "peerId123",
              },
            ],
          }),
        ),
      );

      await taskStore.assign({
        entityId: "task123",
        workerPeerIdStr: "workerPeerId123",
      });

      expect(mockDatastore.put).toHaveBeenCalled();
      const updatedRecord = JSON.parse(
        mockDatastore.put.mock.calls[0][1].toString(),
      );
      expect(updatedRecord.events[1].type).toBe("assign");
      expect(updatedRecord.events[1].assignedToPeer).toBe("workerPeerId123");
    });

    it("should assign task to worker when last event is reject", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "reject",
                timestamp: 2000,
                reason: "busy",
                rejectedByPeer: "worker1",
              },
            ],
          }),
        ),
      );

      await taskStore.assign({
        entityId: "task123",
        workerPeerIdStr: "workerPeerId123",
      });

      const updatedRecord = JSON.parse(
        mockDatastore.put.mock.calls[0][1].toString(),
      );
      expect(updatedRecord.events[2].type).toBe("assign");
    });

    it("should throw when trying to assign to a non-assignable state", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              { type: "assign", timestamp: 2000, assignedToPeer: "worker1" },
            ],
          }),
        ),
      );

      await expect(
        taskStore.assign({
          entityId: "task123",
          workerPeerIdStr: "workerPeerId123",
        }),
      ).rejects.toThrow(TaskValidationError);
    });
  });

  describe("accept", () => {
    it("should accept task when properly assigned", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: Math.floor(Date.now() / 1000) - 10,
                assignedToPeer: "workerPeerId123",
              },
            ],
          }),
        ),
      );

      await taskStore.accept({
        entityId: "task123",
        peerIdStr: "workerPeerId123",
      });

      const updatedRecord = JSON.parse(
        mockDatastore.put.mock.calls[0][1].toString(),
      );
      expect(updatedRecord.events[2].type).toBe("accept");
    });

    it("should throw when accepting an expired task", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: Math.floor(Date.now() / 1000) - 3600,
                assignedToPeer: "workerPeerId123",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.accept({
          entityId: "task123",
          peerIdStr: "workerPeerId123",
        }),
      ).rejects.toThrow(TaskExpiredError);
    });

    it("should throw when accepting a task not assigned to this worker", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "differentWorker",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.accept({
          entityId: "task123",
          peerIdStr: "workerPeerId123",
        }),
      ).rejects.toThrow(TaskValidationError);
    });
  });

  describe("reject", () => {
    it("should reject task when properly assigned", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
            ],
          }),
        ),
      );

      await taskStore.reject({
        entityId: "task123",
        peerIdStr: "workerPeerId123",
        reason: "Too busy",
      });

      const updatedRecord = JSON.parse(
        mockDatastore.put.mock.calls[0][1].toString(),
      );
      expect(updatedRecord.events[2].type).toBe("reject");
      expect(updatedRecord.events[2].reason).toBe("Too busy");
    });

    it("should throw when rejecting a task not assigned to this worker", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "differentWorker",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.reject({
          entityId: "task123",
          peerIdStr: "workerPeerId123",
          reason: "Too busy",
        }),
      ).rejects.toThrow(TaskValidationError);
    });
  });

  describe("complete", () => {
    it("should complete task when properly accepted", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
              {
                type: "accept",
                timestamp: Math.floor(Date.now() / 1000) - 10, // 10 seconds ago
                acceptedByPeer: "workerPeerId123",
              },
            ],
          }),
        ),
      );

      await taskStore.complete({
        entityId: "task123",
        result: "Task completed successfully",
        peerIdStr: "workerPeerId123",
      });

      const updatedRecord = JSON.parse(
        mockDatastore.put.mock.calls[0][1].toString(),
      );
      expect(updatedRecord.events[3].type).toBe("submission");
      expect(updatedRecord.events[3].result).toBe(
        "Task completed successfully",
      );
    });

    it("should throw when completing an expired task", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: { ...mockTask, timeLimitSeconds: 60 }, // 1 minute limit
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
              {
                type: "accept",
                timestamp: Math.floor(Date.now() / 1000) - 120, // 2 minutes ago
                acceptedByPeer: "workerPeerId123",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.complete({
          entityId: "task123",
          result: "Task completed",
          peerIdStr: "workerPeerId123",
        }),
      ).rejects.toThrow(TaskExpiredError);
    });

    it("should throw when completing a task not accepted by this worker", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
              {
                type: "accept",
                timestamp: 3000,
                acceptedByPeer: "differentWorker",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.complete({
          entityId: "task123",
          result: "Task completed",
          peerIdStr: "workerPeerId123",
        }),
      ).rejects.toThrow(TaskValidationError);
    });

    it("should throw when task is already completed", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
              {
                type: "accept",
                timestamp: 3000,
                acceptedByPeer: "workerPeerId123",
              },
              {
                type: "complete",
                timestamp: 4000,
                completedByPeer: "workerPeerId123",
                result: "done",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.complete({
          entityId: "task123",
          result: "Task completed again",
          peerIdStr: "workerPeerId123",
        }),
      ).rejects.toThrow(TaskValidationError);
    });
  });

  describe("payout", () => {
    const mockPayment = {
      id: "payment123",
      amount: 100,
      recipient: "workerPeerId123",
      nonce: 1,
      timestamp: Math.floor(Date.now() / 1000),
    };

    it("should add payout event when task is completed", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
              {
                type: "accept",
                timestamp: 3000,
                acceptedByPeer: "workerPeerId123",
              },
              {
                type: "submission",
                timestamp: 4000,
                completedByPeer: "workerPeerId123",
                result: "done",
              },
            ],
          }),
        ),
      );

      await taskStore.payout({
        entityId: "task123",
        payment: mockPayment,
      });

      const updatedRecord = JSON.parse(
        mockDatastore.put.mock.calls[0][1].toString(),
      );
      expect(updatedRecord.events[4].type).toBe("payout");
      expect(updatedRecord.events[4].payment).toEqual(mockPayment);
    });

    it("should throw when paying out a non-completed task", async () => {
      mockDatastore.get.mockResolvedValueOnce(
        Buffer.from(
          stringifyWithBigInt({
            state: mockTask,
            events: [
              { type: "create", timestamp: 1000, providerPeer: "peerId123" },
              {
                type: "assign",
                timestamp: 2000,
                assignedToPeer: "workerPeerId123",
              },
              {
                type: "accept",
                timestamp: 3000,
                acceptedByPeer: "workerPeerId123",
              },
            ],
          }),
        ),
      );

      await expect(
        taskStore.payout({
          entityId: "task123",
          payment: mockPayment,
        }),
      ).rejects.toThrow(TaskValidationError);
    });
  });
});
