import {
	type Task,
	type PeerId,
	TypedEventEmitter,
	type PeerStore,
	type ConnectionManager,
	type Registrar,
} from "@effectai/task-core";
import { Uint8ArrayList } from "uint8arraylist";

export interface TaskManagerComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
}

export enum TaskStatus {
	PENDING = "pending",
	ACCEPTED = "accepted",
	COMPLETED = "completed",
	REJECTED = "rejected",
}

export interface WorkerServiceEvents {
	"task:received": Task;
	"task:accepted": Task;
	"task:completed": Task;
	"task:rejected": Task;
}

export class WorkerService extends TypedEventEmitter<WorkerServiceEvents> {
	private components: TaskManagerComponents;
	private tasks: Map<
		string,
		{ peerId: PeerId; task: Task; status: TaskStatus }
	> = new Map();

	constructor(components: TaskManagerComponents) {
		super();

		this.components = components;
		this._initialize();
	}

	private _initialize() {
		console.log("Initializing worker service..");
		this.components.registrar.handle(
			"/effect-ai/task/1.0.0",
			async (streamData) => {
				const data = new Uint8ArrayList();

				for await (const chunk of streamData.stream.source) {
					data.append(chunk);
				}

				const messageFromManager = JSON.parse(
					new TextDecoder().decode(data.subarray()),
				);

				console.log("workerService received message", messageFromManager);

				switch (messageFromManager.t) {
					case "task": {
						// add task to the list of tasks
						this.addTask(
							streamData.connection.remotePeer,
							messageFromManager.d,
						);
						break;
					}
				}
			},
			{ runOnLimitedConnection: false },
		);
	}

	public addTask(peerId: PeerId, task: Task) {
		this.tasks.set(task.id, { peerId, task: task, status: TaskStatus.PENDING });
		this.safeDispatchEvent("task:received", { detail: task });
	}

	public completeTask(task: Task) {
		const t = this.tasks.get(task.id);

		if (!t) {
			throw new Error("Task not found");
		}

		this.tasks.set(task.id, { ...t, status: TaskStatus.COMPLETED });

		this._sendMessage(
			t.peerId,
			JSON.stringify({ t: "task:completed", d: task }),
		);

		this.safeDispatchEvent("task:completed", { detail: task });
	}

	public listTasks() {
		return Array.from(this.tasks.values());
	}

	_sendMessage(peerId: PeerId, message: string) {
		console.log("Sending message", message);

		// see if we have a stream to the manager
		const connections =
			this.components.connectionManager.getConnections(peerId);

		// if not, open a new stream
		if (connections.length === 0) {
			// TODO:: try to open a new stream to the manager
			console.warn("No connections found to the manager");
			return;
		}

		console.log("Connections", connections);
		const connection = connections[0];

		// get open stream on the connections
		const stream = connection.streams.find(
			(stream) => stream.protocol === "/effect-ai/task/1.0.0",
		);

		if (!stream) {
			//TODO:: open a new stream
			console.warn("No stream found for manager");
			return;
		}

		// send the message
		stream.sink([new TextEncoder().encode(message)]);
	}
}

export function workerService(
	// init: Partial<TaskManagerInit> = {}
): (components: TaskManagerComponents) => WorkerService {
	return (components: TaskManagerComponents) => new WorkerService(components);
}
