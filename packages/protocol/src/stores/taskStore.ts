import { type Datastore, Key } from "interface-datastore";
import { Payment, Task } from "./../common/proto/effect.js";
import {
	computeTaskId,
	parseWithBigInt,
	stringifyWithBigInt,
} from "../core/utils.js";
import type { PeerId } from "@libp2p/interface";

import { TaskValidationError } from "../common/errors.js";

export interface TaskRecord {
	state: Task;
	events: TaskEvent[];
}

export type TaskEvent =
	| TaskCreatedEvent
	| TaskAssignedEvent
	| TaskCompletedEvent
	| RejectTaskEvent
	| TaskAcceptedEvent
	| TaskPaymentEvent;

export interface TaskCreatedEvent {
	timestamp: number;
	type: "create";
	provider: string;
}

export interface TaskAssignedEvent {
	timestamp: number;
	type: "assign";
	worker: string;
}

export interface TaskPaymentEvent {
	timestamp: number;
	type: "payout";
	payment: Payment;
}

export interface TaskCompletedEvent {
	timestamp: number;
	type: "complete";
	result: string;
	worker: string;
}

export type TaskAcceptedEvent = {
	timestamp: number;
	type: "accept";
	worker: string;
};

export type RejectTaskEvent = {
	timestamp: number;
	type: "reject";
	reason: string;
};

export type TaskStore = {
	all: () => Promise<TaskRecord[]>;
	has: (args: { entityId: string }) => Promise<boolean>;
	get: (args: { entityId: string }) => Promise<TaskRecord>;
	put: (args: { entityId: string; record: TaskRecord }) => Promise<Key>;
	delete: (args: { entityId: string }) => Promise<void>;
	create: (args: {
		providerPeerId: PeerId;
		task: Task;
	}) => Promise<TaskRecord>;
	complete: (args: {
		entityId: string;
		result: string;
		timestamp: number;
		worker: string;
	}) => Promise<void>;
	accept: (args: {
		entityId: string;
		worker: string;
	}) => Promise<void>;
	reject: (args: {
		taskRecord: TaskRecord;
		reason: string;
		timestamp: number;
	}) => Promise<void>;
	assign: (args: {
		entityId: string;
		worker: string;
	}) => Promise<void>;
	payout: (args: {
		entityId: string;
		payment: Payment;
	}) => Promise<void>;
};

export const createTaskStore = ({ datastore }: { datastore: Datastore }) => {
	const has = async ({ entityId }: { entityId: string }): Promise<boolean> => {
		return datastore.has(new Key(`/tasks/${entityId}`));
	};

	const get = async ({
		entityId,
	}: {
		entityId: string;
	}): Promise<TaskRecord> => {
		try {
			const data = await datastore.get(new Key(`/tasks/${entityId}`));
			return parseWithBigInt(data.toString());
		} catch (e) {
			console.error("Entity not found");
			throw e;
		}
	};

	const put = async ({
		entityId,
		record,
	}: {
		entityId: string;
		record: TaskRecord;
	}): Promise<Key> => {
		return datastore.put(
			new Key(`/tasks/${entityId}`),
			Buffer.from(stringifyWithBigInt(record)),
		);
	};

	const del = async ({ entityId }: { entityId: string }): Promise<void> => {
		await datastore.delete(new Key(`/tasks/${entityId}`));
	};

	const all = async (): Promise<TaskRecord[]> => {
		const tasks: TaskRecord[] = [];
		for await (const entry of datastore.query({})) {
			tasks.push(JSON.parse(entry.value.toString()));
		}
		return tasks;
	};

	const create = async ({
		providerPeerId,
		task,
	}: {
		providerPeerId: PeerId;
		task: Task;
	}): Promise<TaskRecord> => {
		const record: TaskRecord = {
			events: [
				{
					timestamp: Math.floor(Date.now() / 1000),
					type: "create",
					provider: providerPeerId.toString(),
				},
			],
			state: task,
		};

		const entityId = computeTaskId(
			providerPeerId.toString(),
			task.templateData,
		);
		await put({ entityId, record });

		return record;
	};

	const complete = async ({
		entityId,
		result,
		timestamp,
		worker,
	}: {
		entityId: string;
		result: string;
		timestamp: number;
		worker: string;
	}): Promise<void> => {
		const taskRecord = await get({ entityId });

		// Check if task is already completed
		if (taskRecord.events.some((e) => e.type === "complete")) {
			throw new TaskValidationError("Task is already completed");
		}

		taskRecord.events.push({
			type: "complete",
			timestamp,
			result,
			worker,
		});

		await put({ entityId, record: taskRecord });
	};

	const accept = async ({
		entityId,
		worker,
	}: {
		entityId: string;
		worker: string;
	}): Promise<void> => {
		const taskRecord = await get({ entityId });

		taskRecord.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "accept",
			worker,
		});

		await put({ entityId, record: taskRecord });
	};

	const reject = async ({
		taskRecord,
		reason,
		timestamp,
	}: {
		taskRecord: TaskRecord;
		reason: string;
		timestamp: number;
	}): Promise<void> => {
		taskRecord.events.push({
			timestamp,
			type: "reject",
			reason,
		});

		await put({ entityId: taskRecord.state.id, record: taskRecord });
	};

	const assign = async ({
		entityId,
		worker,
	}: {
		entityId: string;
		worker: string;
	}): Promise<void> => {
		const record = await get({ entityId });
		record.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "assign",
			worker,
		});
		await put({ entityId, record });
	};

	const payout = async ({
		entityId,
		payment,
	}: {
		entityId: string;
		payment: Payment;
	}): Promise<void> => {
		const record = await get({ entityId });
		record.events.push({
			timestamp: Math.floor(Date.now() / 1000),
			type: "payout",
			payment,
		});
		await put({ entityId, record });
	};

	return {
		has,
		get,
		put,
		delete: del,
		all,
		create,
		complete,
		accept,
		reject,
		assign,
		payout,
	};
};
