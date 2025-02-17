import {
	type ComponentLogger,
	type Libp2pEvents,
	type Logger,
	type PeerId,
	type PeerStore,
	type Startable,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import { peerIdFromString } from "@libp2p/peer-id";
import {
	type TaskStore,
	type TaskProtocol,
	type Task,
	TaskStatus,
} from "../../core/src/index.js";

export interface TaskManagerComponents {
	peerId: PeerId;
	registrar: Registrar;
	peerStore: PeerStore;
	taskStore: TaskStore;
	task: TaskProtocol;
	connectionManager: ConnectionManager;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export interface WorkerServiceEvents {
	"task:accepted": string;
	"task:rejected": string;
}

export class WorkerService
	extends TypedEventEmitter<WorkerServiceEvents>
	implements Startable
{
	private components: TaskManagerComponents;
	private log: Logger;

	constructor(components: TaskManagerComponents) {
		super();
		this.components = components;
		this.log = components.logger.forComponent("WorkerService");
	}

	start(): void | Promise<void> {
		this.components.task.addEventListener("task:received", async (taskInfo) => {
			await this.components.taskStore.put(taskInfo.detail);
		});
	}

	stop(): void | Promise<void> {
		this.components.events.safeDispatchEvent("peer:disconnect", {
			detail: this.components.peerStore.get(this.components.peerId),
		});
	}

	async acceptTask(task: Task) {
		task.status = TaskStatus.IN_PROGRESS;
		await this.components.taskStore.put(task);
		this.safeDispatchEvent("task:accepted", { detail: task.id });
	}

	async rejectTask(taskId: string) {
		throw new Error("Method not implemented.");
	}

	async completeTask(taskId: string, result: string) {
		//get the task from the store
		const task = await this.components.taskStore.get(taskId);

		if (!task) {
			throw new Error("Task not found in the store");
		}

		//set the result
		task.result = result;

		//save the task in the taskStore
		await this.components.taskStore.put(task);

		//send the result to the manager peer
		await this.components.task.sendTask(task.manager, task);
	}
}

export function workerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: TaskManagerComponents,
) => WorkerService {
	return (components: TaskManagerComponents) => new WorkerService(components);
}
