// manager-task-store.ts
import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import { Payment, type Task } from "../../common/index.js";
import { createCoreTaskStore } from "../../stores/taskStore.js";
import type { Datastore } from "interface-datastore";
import { TaskExpiredError, TaskValidationError } from "../../common/errors.js";
import type { BaseTaskEvent, TaskRecord } from "../../common/types.js";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import { ManagerEvents } from "../main.js";

export type ManagerTaskEvent =
	| TaskCreatedEvent
	| TaskAssignedEvent
	| TaskSubmissionEvent
	| RejectTaskEvent
	| TaskAcceptedEvent
	| TaskPaymentEvent;

export interface TaskCreatedEvent extends BaseTaskEvent {
	type: "create";
	providerPeer: string;
}

export interface TaskAssignedEvent extends BaseTaskEvent {
	type: "assign";
	assignedToPeer: string;
}

export interface TaskAcceptedEvent extends BaseTaskEvent {
	type: "accept";
	acceptedByPeer: string;
}

export interface RejectTaskEvent extends BaseTaskEvent {
	type: "reject";
	reason: string;
	rejectedByPeer: string;
}

export interface TaskSubmissionEvent extends BaseTaskEvent {
	type: "submission";
	result: string;
	submissionByPeer: string;
}

export interface TaskPaymentEvent extends BaseTaskEvent {
	type: "payout";
	payment: Payment;
}

export interface TaskCompletedEvent extends BaseTaskEvent {
	type: "complete";
	result: string;
	completedByPeer: string;
}

export type ManagerTaskRecord = TaskRecord<ManagerTaskEvent>;

export const createManagerTaskStore = ({
	datastore,
	eventEmitter,
}: {
	datastore: Datastore;
	eventEmitter: TypedEventEmitter<ManagerEvents>;
}) => {
	const coreStore = createCoreTaskStore<ManagerTaskEvent>({ datastore });

	const create = async ({
		task,
		providerPeerId,
	}: {
		task: Task;
		providerPeerId: PeerId;
	}): Promise<ManagerTaskRecord> => {
		const record: ManagerTaskRecord = {
			events: [
				{
					timestamp: Math.floor(Date.now() / 1000),
					type: "create",
					providerPeer: providerPeerId.toString(),
				},
			],
			state: task,
		};

		await coreStore.put({ entityId: task.id, record });

		eventEmitter.safeDispatchEvent("task:created", { detail: record });

		return record;
	};

	const complete = async ({
		entityId,
		result,
		peerIdStr,
	}: {
		entityId: string;
		result: string;
		peerIdStr: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		if (taskRecord.events.some((e) => e.type === "submission")) {
			throw new TaskValidationError("Task is already submitted");
		}

		// only allowed to complete if last event is accept
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];
		if (lastEvent.type !== "accept" || lastEvent.acceptedByPeer !== peerIdStr) {
			throw new TaskValidationError("Task was not accepted by this worker");
		}

		if (
			Date.now() / 1000 - lastEvent.timestamp >=
			taskRecord.state.timeLimitSeconds
		) {
			throw new TaskExpiredError("Task has expired.");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "submission",
			result,
			submissionByPeer: peerIdStr,
		});

		await coreStore.put({ entityId, record: taskRecord });

		eventEmitter.safeDispatchEvent("task:submission", {
			detail: taskRecord,
		});
	};

	const accept = async ({
		entityId,
		peerIdStr,
	}: {
		entityId: string;
		peerIdStr: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		// only allowed to accept if last event is assign
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];
		if (lastEvent.type !== "assign" || lastEvent.assignedToPeer !== peerIdStr) {
			throw new TaskValidationError("Task was not assigned to this worker");
		}

		if (Date.now() / 1000 - lastEvent.timestamp >= TASK_ACCEPTANCE_TIME) {
			throw new TaskExpiredError("Task has expired.");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "accept",
			acceptedByPeer: peerIdStr,
		});

		await coreStore.put({ entityId, record: taskRecord });

		eventEmitter.safeDispatchEvent("task:accepted", { detail: taskRecord });
	};

	const reject = async ({
		entityId,
		peerIdStr,
		reason,
	}: {
		entityId: string;
		peerIdStr: string;
		reason: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		// only allowed to reject if last event is assign
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];

		if (lastEvent.type !== "assign" || lastEvent.assignedToPeer !== peerIdStr) {
			throw new TaskValidationError("Task was not assigned to this worker");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "reject",
			reason,
			rejectedByPeer: peerIdStr,
		});

		await coreStore.put({ entityId, record: taskRecord });
	};

	const payout = async ({
		entityId,
		payment,
	}: {
		entityId: string;
		payment: Payment;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		// only allowed to payout if last event is complete
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];

		if (lastEvent.type !== "submission") {
			throw new TaskValidationError("Task is not submitted yet");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "payout",
			payment,
		});

		await coreStore.put({ entityId, record: taskRecord });
	};

	const assign = async ({
		entityId,
		workerPeerIdStr,
	}: {
		entityId: string;
		workerPeerIdStr: string;
	}): Promise<void> => {
		const taskRecord = await coreStore.get({ entityId });

		// only allowed to assign if last event is create or reject.
		const lastEvent = taskRecord.events[taskRecord.events.length - 1];

		if (lastEvent.type !== "create" && lastEvent.type !== "reject") {
			throw new TaskValidationError("Task is not in a valid state to assign");
		}

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "assign",
			assignedToPeer: workerPeerIdStr,
		});

		await coreStore.put({ entityId, record: taskRecord });
	};

	return {
		...coreStore,
		create,
		complete,
		accept,
		reject,
		payout,
		assign,
	};
};

export type ManagerTaskStore = ReturnType<typeof createManagerTaskStore>;
