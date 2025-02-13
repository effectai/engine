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
		return this.datastore.has(new Key(taskId));
	}

	async get(taskId: string): Promise<Task | undefined> {
		return Task.decode(await this.datastore.get(new Key(taskId)));
	}

	async put(task: Task): Promise<Task> {
		await this.datastore.put(new Key(task.id), Task.encode(task));
		this.safeDispatchEvent("task:stored", { detail: task });
		return task;
	}
}

export function taskStore(): (components: TaskStoreComponents) => TaskStore {
	return (components: TaskStoreComponents) => new TaskStore(components);
}
