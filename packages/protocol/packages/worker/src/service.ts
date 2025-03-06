import {
	TaskProtocolService,
	TaskStatus,
	type Task,
	type TaskStore,
} from "@effectai/protocol-core";

import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	type PeerStore,
	type Startable,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import type { Datastore } from "interface-datastore";

export interface WorkerServiceComponents {
	peerId: PeerId;
	registrar: Registrar;
	peerStore: PeerStore;
	datastore: Datastore;
	connectionManager: ConnectionManager;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export interface WorkerServiceEvents {
	"task:received": string;
	"task:accepted": string;
	"task:rejected": string;

	"challenge:received": string;
	"challenge:accepted": string;

	"payment:received": string;
}

export class WorkerService
	extends TypedEventEmitter<WorkerServiceEvents>
	implements Startable
{
	private components: WorkerServiceComponents;
	private taskService: TaskProtocolService;

	constructor(components: WorkerServiceComponents) {
		super();
		this.components = components;
		this.taskService = new TaskProtocolService(this.components);
	}

	start(): void | Promise<void> {
		this.taskService.addEventListener("task:received", async (taskInfo) => {
			await this.taskService.storeTask(taskInfo.detail);
		});
	}

	stop(): void | Promise<void> {
		this.components.events.safeDispatchEvent("peer:disconnect", {
			detail: this.components.peerStore.get(this.components.peerId),
		});
	}

	async acceptTask(task: Task) {
		task.status = TaskStatus.IN_PROGRESS;
		await this.taskService.storeTask(task);
		this.safeDispatchEvent("task:accepted", { detail: task.id });

		//send ack back to the manager
		await this.taskService.sendTask(task.manager, task);
	}

	async rejectTask(taskId: string) {
		throw new Error("Method not implemented.");
	}

	async completeTask(taskId: string, result: string) {
		//get the task from the store
		const task = await this.taskService.getTask(taskId);

		if (!task) {
			throw new Error("Task not found in the store");
		}

		//set the result
		task.result = result;

		//save the task in the taskStore
		await this.taskService.storeTask(task);

		//send the result to the manager peer
		await this.taskService.sendTask(task.manager, task);
	}

	async getTasks() {
		return await this.taskService.getTasks();
	}
}

export function workerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: WorkerServiceComponents,
) => WorkerService {
	return (components: WorkerServiceComponents) => new WorkerService(components);
}
