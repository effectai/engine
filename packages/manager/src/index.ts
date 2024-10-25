import {
	type TaskFlowMessage,
	type Stream,
	type Multiaddr,
	type Libp2p,
	type NodeEventMap,
	type Task,
	type Batch,
	Libp2pNode,
	createLibp2p,
	webSockets,
	webRTC,
	circuitRelayTransport,
	noise,
	yamux,
	identify,
	filters,
} from "@effectai/task-core";
import { pipe } from "it-pipe";

export type ManagerState = {
	workerNodes: Multiaddr[];
	activeBatch: Batch | null;
	taskMap: Map<string, Task>;
};

export interface ManagerEvents extends NodeEventMap<ManagerState> {
	initialized: Libp2p;
	"batch:started": Batch;
	"task:completed": Task;
}

export class ManagerNode extends Libp2pNode<ManagerState, ManagerEvents> {
	constructor() {
		super({
			workerNodes: [],
			activeBatch: null,
			taskMap: new Map(),
		});
	}

	async init() {
		this.node = await createLibp2p({
			transports: [
				webSockets({ filter: filters.all }),
				webRTC(),
				circuitRelayTransport(),
			],
			connectionGater: {
				denyDialMultiaddr: async () => false,
			},
			connectionEncrypters: [noise()],
			streamMuxers: [yamux()],
			services: { identify: identify() },
		});

		this.emit("initialized", this.node);
	}

	async handleTaskResponse(stream: Stream, task: Task) {
		pipe(stream.source, async (source) => {
			for await (const msg of source) {
				// handle task rejection
				const receivedData = JSON.parse(
					new TextDecoder().decode(msg.subarray()),
				);
				const { d, t } = receivedData as TaskFlowMessage;

				if (t === "task-rejected") {
					console.log("Task rejected by worker node:", d.id);
					break;
				}

				// handle task acceptance
				if (t === "task-accepted") {
					console.log("Task accepted by worker node:", d.id);
					break;
				}

				if (t === "task-completed") {
					console.log("Task completed by worker node:", d.id);
					task.result = d.result;
					break;
				}
			}
		});
	}

	async processBatch(batch: Batch) {
		if (!this.node) {
			throw new Error("Node not initialized");
		}

		if (this.state.activeBatch) {
			throw new Error("There is already an active batch");
		}

		this.emit("batch:started", batch);

		// extract all tasks from the batch
		const tasks = batch.extractTasks();

		// delegate each task to a worker node
		for (const task of tasks) {
			// TODO:: implement a better way to select worker nodes
			const workerNode = this.state.workerNodes.shift();

			if (!workerNode) {
				throw new Error("Failed to select a worker node");
			}

			try {
				const stream = await delegateTaskToWorker(this.node, workerNode, task);
				await this.handleTaskResponse(stream, task);
			} catch (error) {
				// TODO:: requeue the task
				console.error(
					`Failed to delegate task ${task.id} to worker node:`,
					error,
				);
			}
		}
	}
}

export const delegateTaskToWorker = async (
	manager: Libp2p,
	workerNode: Multiaddr,
	task: Task,
) => {

	console.log("Delegating task to worker node:", workerNode.toString());

	const stream = await manager.dialProtocol(workerNode, "/task-flow/1.0.0");
	const sendTaskMessage = JSON.stringify({
		t: "task",
		d: {
			id: task.id,
			template: task.template,
			data: task.data,
		},
	});
	await stream.sink([new TextEncoder().encode(sendTaskMessage)]);
	return stream;
};
