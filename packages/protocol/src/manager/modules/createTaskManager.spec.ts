import { describe, it, expect, vi, beforeEach } from "vitest";
import { peerIdFromString } from "@libp2p/peer-id";
import { TaskExpiredError } from "../../common/errors.js";
import { TaskCompletedEvent, TaskRecord } from "../../stores/taskStore.js";
import { createTaskManager } from "./createTaskManager.js";

const now = Math.floor(Date.now() / 1000);
const mockWorkerId = peerIdFromString(
	"12D3KooWCGYNj72ZrtiXG8MUvSEmEUZUvq1Uksz2JGBqAQofmGk2",
).toString();

const mockPeerId = (): any => ({
	toString: () => mockWorkerId,
});

const mockPrivateKey = {
	raw: new Uint8Array(64),
} as any;

const baseTaskRecord: TaskRecord = {
	state: {
		id: "task-1",
		reward: 10n,
		timeLimitSeconds: 3600,
		title: "",
		templateId: "",
		templateData: "",
	},
	events: [],
};

let manager: ReturnType<typeof createTaskManager>;
let mockTaskStore: any;
let mockPaymentManager: any;
let mockWorkerQueue: any;
let mockManager: any;

describe("createTaskManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockTaskStore = {
			create: vi.fn(),
			accept: vi.fn(),
			complete: vi.fn(),
			reject: vi.fn(),
			assign: vi.fn(),
			payout: vi.fn(),
		};

		mockPaymentManager = {
			generatePayment: vi.fn(),
		};

		mockWorkerQueue = {
			dequeueWorker: vi.fn(() => mockWorkerId),
		};

		mockManager = {
			sendMessage: vi.fn(),
			getNode: () => ({
				peerStore: {
					get: vi.fn(() => ({})),
				},
			}),
		};

		manager = createTaskManager({
			manager: mockManager,
			taskStore: mockTaskStore,
			workerQueue: mockWorkerQueue,
			paymentManager: mockPaymentManager,
		});
	});

	it("creates a task", async () => {
		const providerPeerId = mockPeerId();

		await manager.createTask({
			providerPeerId,
			task: baseTaskRecord.state,
		});

		expect(mockTaskStore.create).toHaveBeenCalledWith({
			providerPeerId,
			task: baseTaskRecord.state,
		});
	});

	it("accepts a task if assigned to the worker and not expired", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "assign",
					worker: mockWorkerId,
					timestamp: now,
				},
			],
		};

		await manager.acceptTask({
			taskRecord,
			worker: peerIdFromString(mockWorkerId),
		});

		expect(mockTaskStore.accept).toHaveBeenCalledWith({
			entityId: taskRecord.state.id,
			worker: mockWorkerId,
		});
	});

	it("throws if accepting task not assigned to this worker", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "assign",
					worker: "someone-else",
					timestamp: now,
				},
			],
		};

		await expect(
			manager.acceptTask({
				taskRecord,
				worker: peerIdFromString(mockWorkerId),
			}),
		).rejects.toThrow("task was not assigned to this worker.");
	});

	it("throws if accepting expired task", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "assign",
					worker: mockWorkerId,
					timestamp: now - 9999,
				},
			],
		};

		await expect(
			manager.acceptTask({
				taskRecord,
				worker: peerIdFromString(mockWorkerId),
			}),
		).rejects.toThrow(TaskExpiredError);
	});

	it("completes a task if accepted and within time", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "accept",
					worker: mockWorkerId,
					timestamp: now,
				},
			],
		};

		await manager.completeTask({
			taskRecord,
			worker: peerIdFromString(mockWorkerId),
			result: "result",
		});

		expect(mockTaskStore.complete).toHaveBeenCalledWith({
			entityId: taskRecord.state.id,
			worker: mockWorkerId,
			result: "result",
			timestamp: expect.any(Number),
		});
	});

	it("throws if completing task not accepted", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [],
		};

		await expect(
			manager.completeTask({
				taskRecord,
				worker: peerIdFromString(mockWorkerId),
				result: "result",
			}),
		).rejects.toThrow("Task not accepted by this worker.");
	});

	it("throws if completing an expired task", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "accept",
					worker: mockWorkerId,
					timestamp: now - 5000,
				},
			],
		};

		await expect(
			manager.completeTask({
				taskRecord,
				worker: peerIdFromString(mockWorkerId),
				result: "result",
			}),
		).rejects.toThrow(TaskExpiredError);
	});

	it("assigns a task to a worker", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [{ type: "create", timestamp: now, provider: mockWorkerId }],
		};

		await manager.assignTask({ taskRecord });

		expect(mockWorkerQueue.dequeueWorker).toHaveBeenCalled();
		expect(mockManager.sendMessage).toHaveBeenCalledWith(
			peerIdFromString(mockWorkerId),
			{ task: taskRecord.state },
		);
		expect(mockTaskStore.assign).toHaveBeenCalledWith({
			entityId: taskRecord.state.id,
			worker: mockWorkerId,
		});
	});

	it("does not assign if already assigned", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "assign",
					worker: mockWorkerId,
					timestamp: now,
				},
			],
		};

		await expect(manager.assignTask({ taskRecord })).rejects.toThrow(
			"Task is already assigned.",
		);
	});

	it("manages a task with a 'create' event", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [{ type: "create", timestamp: now, provider: mockWorkerId }],
		};

		await manager.manageTask(taskRecord);

		//expect sendMessage to have been called
		expect(mockManager.sendMessage).toHaveBeenCalledWith(
			peerIdFromString(mockWorkerId),
			{ task: taskRecord.state },
		);

		expect(mockWorkerQueue.dequeueWorker).toHaveBeenCalled();

		//expect mockTaskStore assign to be called
		expect(mockTaskStore.assign).toHaveBeenCalledWith({
			entityId: taskRecord.state.id,
			worker: mockWorkerId,
		});
	});

	it("manages a task with an 'assign' event and reassigns if expired", async () => {
		const rejectSpy = vi.spyOn(mockTaskStore, "reject");

		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [{ type: "assign", worker: mockWorkerId, timestamp: now - 9999 }],
		};

		//mock rejects type to add a reject event to taskRecord
		rejectSpy.mockImplementation(async ({ taskRecord }) => {
			taskRecord.events.push({
				type: "reject",
				reason: "Task expired",
				timestamp: now,
			});
		});

		await manager.manageTask(taskRecord);

		expect(rejectSpy).toHaveBeenCalled();
	});

	it("manages a task with an unknown event type", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [{ type: "unknown", timestamp: now }],
		};

		await manager.manageTask(taskRecord); // should log error, not crash
	});

	it("handles a completed task and generates payment", async () => {
		const taskRecord: TaskRecord = {
			...baseTaskRecord,
			events: [
				{
					type: "complete",
					worker: mockWorkerId,
					timestamp: now,
					result: "result",
				},
			],
		};

		//mock payment generation
		mockPaymentManager.generatePayment.mockResolvedValue({
			amount: taskRecord.state.reward,
			recipient: mockWorkerId,
			nonce: 1n,
		});

		await manager.manageTask(taskRecord);

		expect(mockTaskStore.payout).toHaveBeenCalledWith(
			expect.objectContaining({
				entityId: taskRecord.state.id,
				payment: expect.objectContaining({
					amount: taskRecord.state.reward,
					recipient: expect.any(String),
					nonce: expect.any(BigInt),
				}),
			}),
		);

		expect(mockManager.sendMessage).toHaveBeenCalled();
		//expect that a payout event was created
	});
});
