import {
	TypedEventEmitter,
	type TypedEventTarget,
	type Libp2pEvents,
	type ComponentLogger,
	type PeerStore,
	type PeerId,
} from "@libp2p/interface";

import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import { TaskStore } from "./store.js";
import type { Datastore } from "interface-datastore";
import { type Task, TaskAccepted, TaskCompleted } from "./task.js";

export interface TaskProtocolEvents {
	"task:received": CustomEvent<Task>;
	"task:sent": CustomEvent<Task>;
}

export interface TaskProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
	datastore: Datastore;
	peerStore: PeerStore;
	peerId: PeerId;
}

export class TaskProtocolService extends TypedEventEmitter<TaskProtocolEvents> {
	private readonly components: TaskProtocolComponents;
	private readonly taskStore: TaskStore;

	constructor(components: TaskProtocolComponents) {
		super();
		this.components = components;
		this.taskStore = new TaskStore(this.components);
	}

	stop(): void | Promise<void> {
		// throw new Error("Method not implemented.");
	}

	async getTasks(): Promise<Task[]> {
		return await this.taskStore.all();
	}

	async getTask(taskId: string): Promise<Task | undefined> {
		return await this.taskStore.get(taskId);
	}

	createTaskAcceptedMessage(task: Task): TaskAccepted {
		const message = TaskAccepted.encode({
			taskId: task.taskId,
			timestamp: Date.now().toString(),
		});

		return TaskAccepted.decode(message);
	}

	createTaskCompletedMessage(task: Task): TaskCompleted {
		const message = TaskCompleted.encode({
			taskId: task.taskId,
			result: task.result,
			worker: this.components.peerId.toString(),
			timestamp: Date.now().toString(),
		});

		return TaskCompleted.decode(message);
	}

	async storeTask(task: Task): Promise<Task> {
		await this.taskStore.put(task);
		return task;
	}
}

export function taskProtocol(): (
	components: TaskProtocolComponents,
) => TaskProtocolService {
	return (components: TaskProtocolComponents) =>
		new TaskProtocolService(components);
}
