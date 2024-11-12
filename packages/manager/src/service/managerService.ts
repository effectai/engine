import {
	type Task,
	type PeerId,
	type PeerStore,
	type ConnectionManager,
	type Registrar,
	type Batch,
	Uint8ArrayList,
	TypedEventEmitter,
} from "@effectai/task-core";

export interface TaskManagerComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
}

export enum Status {
	PENDING = "pending",
	ACCEPTED = "accepted",
	COMPLETED = "completed",
	REJECTED = "rejected",
}

export interface ManagerServiceEvents {
	"batch:received": Batch;
	"batch:accepted": Batch;
	"batch:completed": Batch;

	"task:received": Task;
	"task:accepted": Task;
	"task:completed": Task;
	"task:rejected": Task;
}

export class ManagerService extends TypedEventEmitter<ManagerServiceEvents> {
	private components: TaskManagerComponents;
	
    private tasks: Map<
		string,
		{ peerId: PeerId; task: Task; status: Status }
	> = new Map();

	constructor(components: TaskManagerComponents) {
		super();

		this.components = components;
		this._initialize();
	}

	private _initialize() {
		console.log("Initializing worker service..");

		this.components.registrar.handle(
			"/effect-ai/batch/1.0.0",
			async (streamData) => {
				const data = new Uint8ArrayList();

				for await (const chunk of streamData.stream.source) {
					data.append(chunk);
				}

				const message = JSON.parse(new TextDecoder().decode(data.subarray()));
			},
			{ runOnLimitedConnection: false },
		);

		this.components.registrar.handle(
			"/effect-ai/task/1.0.0",
			async (streamData) => {
				const data = new Uint8ArrayList();

				for await (const chunk of streamData.stream.source) {
					data.append(chunk);
				}

				const message = JSON.parse(new TextDecoder().decode(data.subarray()));

				console.log("ManagerService received message", message);

			},
			{ runOnLimitedConnection: false },
		);
	}

	public addTask(peerId: PeerId, task: Task) {}

	public completeTask(task: Task) {}

	public listTasks() {}

	private _sendMessage(peerId: PeerId, message: string) {}
}

export function managerService(
	// init: Partial<TaskManagerInit> = {}
): (components: TaskManagerComponents) => ManagerService {
	return (components: TaskManagerComponents) => new ManagerService(components);
}
