import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { Task } from "../../protocols/task/pb/task.js";

export interface TaskStoreComponents {
	datastore: Datastore;
	logger: ComponentLogger;
	events: TypedEventTarget<Libp2pEvents>;
}

export interface TaskStoreEvents {
	"task:stored": CustomEvent<Task>;
}

export class TaskStore extends TypedEventEmitter<TaskStoreEvents> {
	private readonly components: TaskStoreComponents;
	private readonly datastore: Datastore;

	constructor(components: TaskStoreComponents) {
		super();
		this.components = components;
		this.datastore = this.components.datastore;
	}

	async has(taskId: string): Promise<boolean> {
		return this.datastore.has(new Key(`/tasks/${taskId}`));
	}

	async get(taskId: string): Promise<Task | undefined> {
		const task = Task.decode(
			await this.datastore.get(new Key(`/tasks/${taskId}`)),
		);
		return task;
	}

	async put(task: Task): Promise<Task> {
		console.log("put task with id:", task.id);
		await this.datastore.put(new Key(`/tasks/${task.id}`), Task.encode(task));
		this.safeDispatchEvent("task:stored", { detail: task });
		return task;
	}

	async all(): Promise<Task[]> {
		const tasks = [];
		for await (const entry of this.datastore.query({ prefix: "/tasks/" })) {
			tasks.push(Task.decode(entry.value));
		}
		return tasks;
	}
}

export function taskStore(): (components: TaskStoreComponents) => TaskStore {
	return (components: TaskStoreComponents) => new TaskStore(components);
}
