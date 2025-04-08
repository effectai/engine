import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import { type Task } from "../../common/index.js";
import { TaskExpiredError } from "../../common/errors.js";
import { TASK_ACCEPTANCE_TIME } from "../../manager/consts.js";
import type {
	TaskAcceptedEvent,
	WorkerTaskRecord,
	WorkerTaskStore,
} from "../stores/workerTaskStore.js";
import type { createEffectEntity } from "../../entity/factory.js";
import type { Libp2pTransport } from "../../transports/libp2p.js";
import { WorkerEvents } from "../main.js";
import { peerIdFromString } from "@libp2p/peer-id";

export function createTaskWorker({
	taskStore,
	worker,
	eventEmitter,
}: {
	eventEmitter: TypedEventEmitter<WorkerEvents>;
	worker: Awaited<ReturnType<typeof createEffectEntity<Libp2pTransport[]>>>;
	taskStore: WorkerTaskStore;
}) {
	const getTask = async ({
		taskId,
	}: {
		taskId: string;
	}) => {
		const taskRecord = await taskStore.get({
			entityId: taskId,
		});

		if (!taskRecord) {
			throw new Error("Task not found.");
		}

		return taskRecord;
	};

	const createTask = async ({
		task,
		managerPeerId,
	}: {
		managerPeerId: PeerId;
		task: Task;
	}) => {
		//TODO:: check if the task is valid.
		//TODO:: is this a task coming from a manager ?
		await taskStore.put({
			task,
			peerId: managerPeerId,
		});
	};

	const acceptTask = async ({
		taskRecord,
	}: {
		taskRecord: WorkerTaskRecord;
	}): Promise<void> => {
		const created = taskRecord.events.find((t) => t.type === "create");

		if (!created) {
			throw new Error("Task not created.");
		}

		if (Date.now() / 1000 - created.timestamp >= TASK_ACCEPTANCE_TIME) {
			throw new TaskExpiredError("Task has expired.");
		}

		await taskStore.accept({
			entityId: taskRecord.state.id,
		});

		// send accepted message to manager
		worker.sendMessage(peerIdFromString(created.managerPeer), {
			taskAccepted: {
				timestamp: Math.floor(Date.now() / 1000),
				taskId: taskRecord.state.id,
				worker: worker.getNode().peerId.toString(),
			},
		});

		//emit task accepted event
		eventEmitter.safeDispatchEvent("task:accepted", { detail: taskRecord });
	};

	const completeTask = async ({
		taskRecord,
		workerPeerId,
		result,
	}: {
		taskRecord: WorkerTaskRecord;
		workerPeerId: PeerId;
		result: string;
	}) => {
		//was it accepted ?
		const accepted = taskRecord.events.find((t) => t.type === "accept");

		if (!accepted) {
			throw new Error("Task not accepted by this worker.");
		}

		const created = taskRecord.events.find((t) => t.type === "create");

		if (!created) {
			throw new Error("Task not created.");
		}

		//is it expired ?
		if (
			Date.now() / 1000 - accepted.timestamp >=
			taskRecord.state.timeLimitSeconds
		) {
			throw new TaskExpiredError("Task has expired.");
		}

		await taskStore.complete({
			entityId: taskRecord.state.id,
			result,
		});

		// send completed message to manager
		worker.sendMessage(peerIdFromString(created?.managerPeer), {
			taskCompleted: {
				taskId: taskRecord.state.id,
				worker: worker.toString(),
				result,
			},
		});

		eventEmitter.safeDispatchEvent("task:completed", { detail: taskRecord });
	};

	const rejectTask = async ({
		taskRecord,
		reason,
	}: { taskRecord: WorkerTaskRecord; reason: string }) => {
		await taskStore.reject({
			entityId: taskRecord.state.id,
			reason,
		});

		eventEmitter.safeDispatchEvent("task:reject", { detail: taskRecord });
	};

	return {
		getTask,
		createTask,
		completeTask,
		acceptTask,
		rejectTask,
	};
}
