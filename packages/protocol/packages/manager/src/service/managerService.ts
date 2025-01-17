import {
	type Task,
	type PeerId,
	type PeerStore,
	type ConnectionManager,
	type Registrar,
	Batch, TypedEventEmitter,
	handleMessage,
	type BatchMessage,
	type TaskMessage
} from "@effectai/task-core";

export interface ManagerServiceComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
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
	private components: ManagerServiceComponents;

	// Manager state
	private tasks: Map<string, Task> = new Map();

	private batches: Map<string, Batch> = new Map();
	private activeBatch: Batch | null = null;

	constructor(components: ManagerServiceComponents) {
		super();

		this.components = components;
		this._initialize();
	}

	private _initialize() {
		this.components.registrar.handle(
			"/effect-ai/batch/1.0.0",
			async (streamData) => {
				const message = await handleMessage(streamData);
				this._processBatchMessage(message);
			},
			{ runOnLimitedConnection: false },
		);

		this.components.registrar.handle(
			"/effect-ai/task/1.0.0",
			async (streamData) => {
				const message = await handleMessage(streamData);
				this._processTaskMessage(message);
			},
			{ runOnLimitedConnection: false },
		);
	}

	private _processTaskMessage(message: TaskMessage) {
		switch (message.t) {
			case "status": {
				console.log("Task status update from worker:", message);
				// handle task status
				break;	
			}
			case "result": {
				console.log("Task result from worker:", message);
				// handle task result
				break;
			}
			default:
				break;
		}
	}

	private _processBatchMessage(message: BatchMessage) {
		switch (message.t) {
			case "batch": {
				// handle batch message
				const batch = Batch.fromMessage(message);
				this.acceptBatch(batch);
				break;
			}
			default:
				break;
		}
	}

	public acceptBatch(batch: Batch) {
		// Accept a batch from a provider
		this.batches.set(batch.id, batch);
		this.activeBatch = batch;
	}

	public rejectBatch(batch: Batch) {
		// Reject a batch from a provider
	}

	public manageBatch(batch: Batch) {
		// Manage a batch
	}

	public delegateTask(peerId: PeerId, task: Task) {
		// Delegate a task to a worker

		// TODO:: this function is responsible for assigning a task to a worker.
		// It should:
		// 1. Find a worker that is available
		// in order to 

		// 2. Send the task to the worker
	}

	private _sendMessage() {
		// Send a message to a peer
	}
}

export function managerService(
	// init: Partial<TaskManagerInit> = {}
): (components: ManagerServiceComponents) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
