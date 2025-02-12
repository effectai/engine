import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { Task } from "../../protobufs/task/task.js";

export type TaskInfo = {
	task: Task;
	peer: PeerId;
};

export interface TaskStoreComponents {
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export class TaskStore extends TypedEventEmitter<Libp2pEvents> {
	private readonly datastore: Datastore;
	private readonly taskPeerMap: Map<string, PeerId> = new Map();

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
		this.taskPeerMap.set(task.id, sender);

		// Emit event for listeners
		// this.safeDispatchEvent("taskStored", { task, sender });

		return task;
	}

	/** Retrieve the sender of a given task */
	getTaskPeer(taskId: string): PeerId | undefined {
		return this.taskPeerMap.get(taskId);
	}
}
