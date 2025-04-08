import type { TaskRecord as ManagerTaskRecord } from "../../stores/taskStore.js";
import { PublicKey } from "@solana/web3.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import type { createManager, ManagerEvents } from "../main.js";
import { managerLogger } from "../../common/logging.js";
import type { createWorkerQueue } from "./createWorkerQueue.js";
import type { createPaymentManager } from "./createPaymentManager.js";
import type {
	ManagerTaskStore,
	TaskAcceptedEvent,
	TaskAssignedEvent,
	TaskCompletedEvent,
	TaskSubmissionEvent,
} from "../stores/managerTaskStore.js";
import { TypedEventEmitter } from "@libp2p/interface";

export function createTaskManager({
	manager,
	workerQueue,
	taskStore,
	paymentManager,
	eventEmitter,
}: {
	manager: Awaited<ReturnType<typeof createManager>>["manager"];
	taskStore: ManagerTaskStore;
	paymentManager: ReturnType<typeof createPaymentManager>;
	workerQueue: ReturnType<typeof createWorkerQueue>;
	eventEmitter: TypedEventEmitter<ManagerEvents>;
}) {
	const isExpired = (timestamp: number) =>
		timestamp + TASK_ACCEPTANCE_TIME < Math.floor(Date.now() / 1000);

	const handleCreateEvent = async (taskRecord: ManagerTaskRecord) => {
		await assignTask({ taskRecord });
	};

	const handleAssignEvent = async (
		taskRecord: ManagerTaskRecord,
		lastEvent: TaskAssignedEvent,
	) => {
		if (isExpired(lastEvent.timestamp)) {
			managerLogger.info("Worker took too long to accept/reject task");

			await taskStore.reject({
				entityId: taskRecord.state.id,
				peerIdStr: lastEvent.assignedToPeer,
				reason: "Worker took too long to accept/reject task",
			});

			await assignTask({ taskRecord });
		}
	};

	const handleAcceptEvent = async (
		taskRecord: ManagerTaskRecord,
		lastEvent: TaskAcceptedEvent,
	) => {
		if (isExpired(lastEvent.timestamp)) {
			managerLogger.info("Worker took too long to accept/reject task");
			await assignTask({ taskRecord });
		}
	};

	const handleSubmissionEvent = async (
		taskRecord: ManagerTaskRecord,
		event: TaskSubmissionEvent,
	) => {
		const payment = await paymentManager.generatePayment({
			peerId: peerIdFromString(event.submissionByPeer),
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
		manager.sendMessage(peerIdFromString(event.submissionByPeer), {
			payment,
		});

		//sendout task completed event
		eventEmitter.safeDispatchEvent("task:completed", { detail: taskRecord });
	};

	const manageTask = async (taskRecord: ManagerTaskRecord) => {
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];

		if (!lastEvent) {
			managerLogger.error("No events found in taskRecord");
			return;
		}

		switch (lastEvent.type) {
			case "create":
				await handleCreateEvent(taskRecord);
				break;
			case "assign":
				await handleAssignEvent(taskRecord, lastEvent);
				break;
			case "accept":
				await handleAcceptEvent(taskRecord, lastEvent);
				break;
			case "submission":
				await handleSubmissionEvent(taskRecord, lastEvent);
				break;
			case "payout":
				// do nothing..
				break;
			default:
				managerLogger.error(`Unknown task event type: ${lastEvent.type}`);
		}
	};

	const assignTask = async ({
		taskRecord,
	}: { taskRecord: ManagerTaskRecord }) => {
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];

		if (lastEvent.type === "assign") {
			throw new Error("Task is already assigned.");
		}

		const worker = workerQueue.dequeueWorker();

		if (!worker) {
			managerLogger.info("No available workers to assign task to");
			return;
		}

		await taskStore.assign({
			entityId: taskRecord.state.id,
			workerPeerIdStr: worker,
		});

		manager.sendMessage(peerIdFromString(worker), { task: taskRecord.state });
	};

	const manageTasks = async () => {
		try {
			const tasks = await taskStore.all();
			managerLogger.info(`Managing ${tasks.length} tasks`);

			for (const task of tasks) {
				await manageTask(task);
			}
		} catch (e) {
			console.error(e);
		}
	};

	return {
		manageTask,
		manageTasks,
		assignTask,
	};
}
