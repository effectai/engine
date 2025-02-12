import { pbStream } from "it-protobuf-stream";
import { PeerId, type PeerStore, TypedEventEmitter } from "@libp2p/interface";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import { Task } from "../../protobufs/task/task.js";
import { type TaskInfo, TaskStore } from "../store/task.js";
import type { Datastore } from "interface-datastore";

export interface TaskManagerComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	datastore: Datastore;
	connectionManager: ConnectionManager;
}

export interface WorkerServiceEvents {
	"task:received": CustomEvent<TaskInfo>;
	"task:completed": CustomEvent<TaskInfo>;
	"task:accepted": string;
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

				this.safeDispatchEvent("task:received", {
					detail: { task: data, peer: streamData.connection.remotePeer },
				});
			},
			{ runOnLimitedConnection: false },
		);

		this.addEventListener("task:received", async (taskInfo) => {
			await this.taskStore.put(taskInfo.detail.task, taskInfo.detail.peer);
		});

		this.addEventListener("task:completed", async (taskInfo) => {
			//check for active connection
			const [connection] = this.components.connectionManager.getConnections(
				taskInfo.detail.peer,
			);

			if (!connection) {
				//TODO:: make a connection to the sender if none exists..
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
				: pbStream(await connection.newStream("/effect-ai/task/1.0.0")).pb(
						Task,
					);

			try {
				await pb.write(taskInfo.detail.task);
			} catch (e) {
				console.error(
					`Error sending task ${
						taskInfo.detail.task.id
					} result to ${taskInfo.detail.peer.toString()}`,
				);
			}
		});
	}

	public async completeTask(taskId: string, result: string) {
		const task = await this.taskStore.get(taskId);
		const peer = this.taskStore.getTaskPeer(taskId);

		if (!task || !peer) {
			throw new Error("Task not found, or has no peer..");
		}

		//set the result
		task.result = result;

		//save the task in the taskStore
		await this.taskStore.put(task, peer);

		this.safeDispatchEvent("task:completed", {
			detail: { task, peer },
		});
	}
}

export function workerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: TaskManagerComponents,
) => WorkerService {
	return (components: TaskManagerComponents) => new WorkerService(components);
}
