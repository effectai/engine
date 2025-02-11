import {
	ComponentLogger,
	Libp2pEvents,
	PeerId,
	TypedEventEmitter,
	TypedEventTarget,
} from "@libp2p/interface";
import { Datastore, Key } from "interface-datastore";
import { Task } from "../../protocol/task/task.js";

export interface TaskStoreComponents {
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export class TaskStore extends TypedEventEmitter<Libp2pEvents> {
	private readonly datastore: Datastore;

	private readonly taskSenderMap: Map<string, PeerId> = new Map();

	constructor(dataStore: Datastore) {
		super();
		this.datastore = dataStore;
	}

	async has(taskId: string): Promise<boolean> {
		return this.datastore.has(new Key(taskId));
	}

	async get(taskId: string): Promise<Task | undefined> {
		return Task.decode(await this.datastore.get(new Key(taskId)));
	}

	async put(task: Task, sender: PeerId): Promise<Task> {
		await this.datastore.put(new Key(task.id), Task.encode(task));

		// Track which peer sent this task
		this.taskSenderMap.set(task.id, sender);

		// Emit event for listeners
		// this.safeDispatchEvent("taskStored", { task, sender });

		return task;
	}

	/** Retrieve the sender of a given task */
	getTaskSender(taskId: string): PeerId | undefined {
		return this.taskSenderMap.get(taskId);
	}
}
