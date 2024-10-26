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
	circuitRelayServer,
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
	constructor(node: Libp2p) {
		super({
			workerNodes: [],
			activeBatch: null,
			taskMap: new Map(),
		});
		this.node = node;
	}

	// TODO:: Implement worker node selection strategy
	selectWorkerNode(): Multiaddr | null {
		return this.state.workerNodes.shift() ?? null;
	}

	async handleTaskResponse(stream: Stream, task: Task) {
		pipe(stream.source, async (source) => {
			for await (const msg of source) {
				const receivedData = JSON.parse(new TextDecoder().decode(msg.subarray()));
				this.handleTaskMessage(receivedData, task);
			}
		});
	}

	handleTaskMessage(message: TaskFlowMessage, task: Task) {
		const { d, t } = message;

		switch (t) {
			case "task-rejected":
				// TODO:: requeue the task
				break;
			case "task-accepted":
				console.log("Task accepted by worker:", d.id);
				break;
			case "task-completed":
				task.result = d.result;
				this.emit("task:completed", task);
				break;
			default:
				console.warn("Unknown task response:", t);
		}
	}

	async delegateTaskToWorker(task: Task) {
		const workerNode = this.selectWorkerNode();
		if (!workerNode) throw new Error("No available worker node");

		const stream = await this.createTaskStream(workerNode, task);
		await this.handleTaskResponse(stream, task);
	}

	async createTaskStream(workerNode: Multiaddr, task: Task) {
		if(!this.node) {
			throw new Error("Node not initialized");
		}

		const stream = await this.node.dialProtocol(workerNode, "/task-flow/1.0.0");
		const sendTaskMessage = JSON.stringify({ t: "task", d: task.toJSON() });
		await stream.sink([new TextEncoder().encode(sendTaskMessage)]);
		return stream;
	}

	async processBatch(batch: Batch) {
		if (!this.node) throw new Error("Node not initialized");
		if (this.state.activeBatch) throw new Error("There is already an active batch");

		this.emit("batch:started", batch);
		this.state.activeBatch = batch;

		const tasks = batch.extractTasks();
		for (const task of tasks) {
			try {
				await this.delegateTaskToWorker(task);
			} catch (error) {
				// TODO:: Handle task delegation failure
				console.error(`Failed to delegate task ${task.id}:`, error);
			}
		}
	}
}

export const createManagerNode = async () => {
	const node = await createLibp2p({
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			identify: identify(),
			relay: circuitRelayServer()
		},
	});

	return new ManagerNode(node);
}