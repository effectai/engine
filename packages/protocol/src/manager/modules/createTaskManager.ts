import type { PeerId, PrivateKey } from "@libp2p/interface";
import {
	createTaskStore,
	type TaskCompletedEvent,
	type TaskEvent,
	type TaskStore,
	type TaskRecord,
} from "../../stores/taskStore.js";
import { PublicKey } from "@solana/web3.js";
import { Payment, type Task } from "../../common/index.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { TaskExpiredError } from "../../common/errors.js";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import type { createManager } from "../main.js";
import { managerLogger } from "../../common/logging.js";
import type { createWorkerQueue } from "./createWorkerQueue.js";
import type { createPaymentManager } from "./createPaymentManager.js";

export function createTaskManager({
	manager,
	taskStore,
	workerQueue,
	paymentManager,
}: {
	manager: Awaited<ReturnType<typeof createManager>>["manager"];
	taskStore: TaskStore;
	paymentManager: ReturnType<typeof createPaymentManager>;
	workerQueue: ReturnType<typeof createWorkerQueue>;
}) {
	const createTask = async ({
		task,
		providerPeerId,
	}: {
		providerPeerId: PeerId;
		task: Task;
	}) => {
		//TODO:: create checks for creating this task.
		//e.g. can we pay out completion of this task ?
		await taskStore.create({
			providerPeerId,
			task,
		});
	};

	const acceptTask = async ({
		taskRecord,
		worker,
	}: {
		taskRecord: TaskRecord;
		worker: PeerId;
	}) => {
		//was it assigned to this worker ?
		const assigned = taskRecord.events.find((t) => t.type === "assign");
		if (!assigned || assigned.worker !== worker.toString()) {
			throw new Error("task was not assigned to this worker.");
		}

		//is it expired ?
		if (Date.now() / 1000 - assigned.timestamp >= TASK_ACCEPTANCE_TIME) {
			throw new TaskExpiredError("Task has expired.");
		}

		await taskStore.accept({
			entityId: taskRecord.state.id,
			worker: worker.toString(),
		});
	};

	const completeTask = async ({
		taskRecord,
		worker,
		result,
	}: {
		taskRecord: TaskRecord;
		worker: PeerId;
		result: string;
	}) => {
		//was it accepted by this worker ?
		const accepted = taskRecord.events.find(
			(t) => t.type === "accept" && t.worker === worker.toString(),
		);

		if (!accepted) {
			throw new Error("Task not accepted by this worker.");
		}

		//is it expired ?
		if (
			Date.now() / 1000 - accepted.timestamp >=
			taskRecord.state.timeLimitSeconds
		) {
			throw new TaskExpiredError("Task has expired.");
		}

		await taskStore.complete({
			timestamp: Date.now() / 1000,
			entityId: taskRecord.state.id,
			worker: worker.toString(),
			result,
		});
	};

	const rejectTask = async ({
		taskRecord,
		reason,
	}: { taskRecord: TaskRecord; reason: string }) => {
		//TODO:: checks if we can actually reject this task.

		await taskStore.reject({
			reason,
			taskRecord,
			timestamp: Date.now() / 1000,
		});
	};

	const isExpired = (timestamp: number) =>
		timestamp + TASK_ACCEPTANCE_TIME < Math.floor(Date.now() / 1000);

	const handleCreate = async (taskRecord: TaskRecord) => {
		await assignTask({ taskRecord });
	};

	const handleAssign = async (taskRecord: TaskRecord, lastEvent: TaskEvent) => {
		if (isExpired(lastEvent.timestamp)) {
			managerLogger.info("Worker took too long to accept/reject task");

			await rejectTask({
				taskRecord,
				reason: "Worker took too long to accept/reject task",
			});

			await assignTask({ taskRecord });
		}
	};

	const handleAccept = async (taskRecord: TaskRecord, lastEvent: TaskEvent) => {
		if (isExpired(lastEvent.timestamp)) {
			managerLogger.info("Worker took too long to accept/reject task");
			await assignTask({ taskRecord });
		}
	};

	const handleComplete = async (
		taskRecord: TaskRecord,
		event: TaskCompletedEvent,
	) => {
		const payment = await paymentManager.generatePayment({
			peerId: peerIdFromString(event.worker),
			amount: taskRecord.state.reward,
			paymentAccount: new PublicKey(
				"796qppG6jGia39AE8KLENa2mpRp5VCtm48J8JsokmwEL",
			),
		});

		//create payout event
		await taskStore.payout({
			entityId: taskRecord.state.id,
			payment,
		});

		//send the payment.
		manager.sendMessage(peerIdFromString(event.worker), {
			payment,
		});
	};

	const manageTask = async (taskRecord: TaskRecord) => {
		const lastEvent = taskRecord.events.at(-1);

		if (!lastEvent) {
			managerLogger.error("No events found in taskRecord");
			return;
		}

		switch (lastEvent.type) {
			case "create":
				await handleCreate(taskRecord);
				break;
			case "assign":
				await handleAssign(taskRecord, lastEvent);
				break;
			case "accept":
				await handleAccept(taskRecord, lastEvent);
				break;
			case "complete":
				await handleComplete(taskRecord, lastEvent);
				break;
			case "payout":
				// do nothing..
				break;
			default:
				managerLogger.error(`Unknown task event type: ${lastEvent.type}`);
		}
	};

	const assignTask = async ({ taskRecord }: { taskRecord: TaskRecord }) => {
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];

		if (lastEvent.type === "assign") {
			throw new Error("Task is already assigned.");
		}

		const worker = workerQueue.dequeueWorker();

		if (!worker) {
			console.error("No worker available to assign task");
			return;
		}

		manager.sendMessage(peerIdFromString(worker), { task: taskRecord.state });

		await taskStore.assign({ entityId: taskRecord.state.id, worker });
	};

	return {
		manageTask,
		createTask,
		completeTask,
		acceptTask,
		rejectTask,
		assignTask,
	};
}
