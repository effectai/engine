import {
	ComponentLogger,
	type Libp2pEvents,
	Logger,
	type PeerStore,
	Startable,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import type { Task } from "../../protocols/task/pb/task.js";
import type { TaskStore } from "../store/task.js";
import type { TaskProtocol } from "../../protocols/task/task.js";
import { peerIdFromString } from "@libp2p/peer-id";

export interface TaskManagerComponents {
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
			this.acceptTask(taskInfo.detail);
		});
	}

	stop(): void | Promise<void> {
		throw new Error("Method not implemented.");
	}

	async acceptTask(task: Task) {
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
		await this.components.task.sendTask(peerIdFromString(task.manager), task);
	}
}

export function workerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: TaskManagerComponents,
) => WorkerService {
	return (components: TaskManagerComponents) => new WorkerService(components);
}
