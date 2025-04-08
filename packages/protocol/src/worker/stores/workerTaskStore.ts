import type { PeerId } from "@libp2p/interface";
import { Payment, type Task } from "../../common/index.js";
import { createCoreTaskStore } from "../../stores/taskStore.js";
import type { Datastore } from "interface-datastore";
import { TaskExpiredError, TaskValidationError } from "../../common/errors.js";
import type { BaseTaskEvent, TaskRecord } from "../../common/types.js";
import { TASK_ACCEPTANCE_TIME } from "../../manager/consts.js";

export type WorkerTaskEvents =
	| TaskCreatedEvent
	| TaskCompletedEvent
	| TaskAcceptedEvent
	| TaskRejectedEvent;

export interface TaskCreatedEvent extends BaseTaskEvent {
	type: "create";
	managerPeer: string;
}

export interface TaskCompletedEvent extends BaseTaskEvent {
	type: "complete";
	result: string;
}

export interface TaskAcceptedEvent extends BaseTaskEvent {
	type: "accept";
}

export interface TaskRejectedEvent extends BaseTaskEvent {
	type: "reject";
	reason: string;
}

export type WorkerTaskRecord = TaskRecord<WorkerTaskEvents>;

export const createWorkerTaskStore = ({
	datastore,
}: {
	datastore: Datastore;
}) => {
	const coreStore = createCoreTaskStore<WorkerTaskEvents>({ datastore });

	const create = async ({
		task,
		managerPeerId,
	}: {
		task: Task;
		managerPeerId: PeerId;
	}): Promise<WorkerTaskRecord> => {
		const record: WorkerTaskRecord = {
			events: [
				{
					timestamp: Math.floor(Date.now() / 1000),
					type: "create",
					managerPeer: managerPeerId.toString(),
				},
			],
			state: task,
		};

		await coreStore.put({ entityId: task.id, record });

		return record;
	};

	const complete = async ({
		entityId,
		result,
	}: {
		entityId: string;
		result: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		if (taskRecord.events.some((e) => e.type === "complete")) {
			throw new TaskValidationError("Task is already completed");
		}

		// only allowed to complete if last event is accept
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];
		if (lastEvent.type !== "accept") {
			throw new TaskValidationError("Task was not accepted..");
		}

		if (
			Date.now() / 1000 - lastEvent.timestamp >=
			taskRecord.state.timeLimitSeconds
		) {
			throw new TaskExpiredError("Task has expired.");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "complete",
			result,
		});

		await coreStore.put({ entityId, record: taskRecord });
	};

	const accept = async ({
		entityId,
	}: {
		entityId: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		// only allowed to accept if last event is created
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];
		if (lastEvent.type !== "create") {
			throw new TaskValidationError("Task was not created.");
		}

		if (Date.now() / 1000 - lastEvent.timestamp >= TASK_ACCEPTANCE_TIME) {
			throw new TaskExpiredError("Task has expired.");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "accept",
		});

		await coreStore.put({ entityId, record: taskRecord });
	};

	const reject = async ({
		entityId,
		reason,
	}: {
		entityId: string;
		peerIdStr: string;
		reason: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		const lastEvent = taskRecord.events[taskRecord.events.length - 1];
		if (lastEvent.type !== "create") {
			throw new TaskValidationError("Task was not created.");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "reject",
			reason,
		});

		await coreStore.put({ entityId, record: taskRecord });
	};

	return {
		...coreStore,
		create,
		complete,
		accept,
		reject,
	};
};
export type WorkerTaskStore = ReturnType<typeof createWorkerTaskStore>;
