import { pbStream } from "it-protobuf-stream";

import { type PeerStore, TypedEventEmitter } from "@libp2p/interface";

import type { Registrar, ConnectionManager } from "@libp2p/interface-internal";

import { Task } from "../../protocol/task/task.js";
import { TaskStore } from "../store/task.js";

import { Datastore } from "interface-datastore";

export interface TaskManagerComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	datastore: Datastore;
	connectionManager: ConnectionManager;
}

export interface WorkerServiceEvents {
	"task:received": string;
	"task:accepted": string;
	"task:completed": string;
	"task:rejected": string;
}

export class WorkerService extends TypedEventEmitter<WorkerServiceEvents> {
	private components: TaskManagerComponents;
	public taskStore: TaskStore;

	constructor(components: TaskManagerComponents) {
		super();
		this.components = components;
		this.taskStore = new TaskStore(components.datastore);
		this._initialize();
	}

	private _initialize() {
		// handle incoming task messages
		this.components.registrar.handle(
			"/effect-ai/task/1.0.0",
			async (streamData) => {
				const stream = pbStream(streamData.stream).pb(Task);
				const data = await stream.read();

				//put task in taskStore
				await this.taskStore.put(data, streamData.connection.remotePeer);
			},
			{ runOnLimitedConnection: false },
		);
	}

	public async completeTask(taskId: string, result: string) {
		//get task from the taskStore
		const task = await this.taskStore.get(taskId);
		const sender = this.taskStore.getTaskSender(taskId);

		if (!task || !sender) {
			throw new Error("Task not found, or has no sender");
		}

		//set the result
		task.result = result;

		//save the task in the taskStore
		await this.taskStore.put(task, sender);

		// ---- Send result to sender (manager) -----

		//check for active connection
		const [connection] =
			this.components.connectionManager.getConnections(sender);

		if (!connection) {
			throw new Error("No active connection to the sender");
		}

		const existingStream = connection.streams.find(
			(s) =>
				s.protocol === "/effect-ai/task/1.0.0" &&
				s.direction === "outbound" &&
				s.status === "open",
		);

		const pb = existingStream
			? pbStream(existingStream).pb(Task)
			: pbStream(await connection.newStream("/effect-ai/task/1.0.0")).pb(Task);

		try {
			await pb.write(task);
			console.log(`Task ${taskId} result sent to ${sender.toString()}`);
		} catch (e) {
			console.error(
				`Error sending task ${taskId} result to ${sender.toString()}`,
			);
		}
	}
}

export function workerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: TaskManagerComponents,
) => WorkerService {
	return (components: TaskManagerComponents) => new WorkerService(components);
}
