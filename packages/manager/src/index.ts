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
	multiaddr,
	workerPubSubPeerDiscovery,
	bootstrap,
	gossipsub,
	persistentPeerStore,
} from "@effectai/task-core";
import { pipe } from "it-pipe";

export class WorkerNotAvailableError extends Error {
	constructor() {
		super("No worker available");
	}
}

export type TaskStatus = "pending" | "accepted" | "completed";

export type ManagerState = {
	workerNodes: Multiaddr[];
	activeBatch: Batch | null;

	// internal map of tasks to track which worker is processing which task
	taskMap: Map<
		string,
		{
			activeWorkerPeerId: string;
			status: TaskStatus;
			updatedAt: Date;
		}
	>;
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
		const activeWorkers = Array.from(this.state.taskMap.values())
			.filter((t) => t.status === "accepted")
			.map((v) => v.activeWorkerPeerId);

		const workerNode = this.state.workerNodes
			.filter((node) => !activeWorkers.includes(node.toString()))
			.shift();

		if (workerNode) {
			// push it back to the end of the queue
			this.state.workerNodes.push(workerNode);
		}

		return workerNode || null;
	}

	async handleTaskResponse(streamPeerId: string, stream: Stream, task: Task) {
		pipe(stream.source, async (source) => {
			for await (const msg of source) {
				const receivedData = JSON.parse(
					new TextDecoder().decode(msg.subarray()),
				);
				this.handleTaskMessage(streamPeerId, receivedData, task);
			}
		});
	}

	handleTaskMessage(
		streamPeerId: string,
		message: TaskFlowMessage,
		task: Task,
	) {
		const { d, t } = message;

		switch (t) {
			case "task-rejected":
				// TODO:: requeue the task
				break;
			case "task-accepted":
				console.log("Task accepted by worker:", d.id);
				// TODO:: get worker id and update internal task state
				this.state.taskMap.set(task.id, {
					activeWorkerPeerId: streamPeerId,
					status: "accepted",
					updatedAt: new Date(),
				});
				break;
			case "task-completed":
				task.result = d.result;
				this.state.taskMap.set(task.id, {
					activeWorkerPeerId: streamPeerId,
					status: "completed",
					updatedAt: new Date(),
				});
				this.emit("task:completed", task);
				break;
			default:
				console.warn("Unknown task response:", t);
		}
	}

	async delegateTaskToWorker(task: Task, worker: Multiaddr) {
		console.log("Delegating task to worker:", task.id);
		const { stream, workerPeerId } = await this.createTaskStream(
			worker,
			task,
		);

		await this.handleTaskResponse(workerPeerId, stream, task);
	}

	async createTaskStream(workerNode: Multiaddr, task: Task) {
		if (!this.node) {
			throw new Error("Node not initialized");
		}

		const connection = await this.node.dial(workerNode);
		const stream = await connection.newStream("/task-flow/1.0.0");
		const workerPeerId = connection.remotePeer.toString();
		const sendTaskMessage = JSON.stringify({ t: "task", d: task.toJSON() });

		// add task to task registry
		this.state.taskMap.set(task.id, {
			activeWorkerPeerId: workerPeerId,
			status: "pending",
			updatedAt: new Date(),
		});

		await stream.sink([new TextEncoder().encode(sendTaskMessage)]);

		return { stream, workerPeerId };
	}

	async processBatch(batch: Batch) {
		if (!this.node) throw new Error("Node not initialized");
		if (this.state.activeBatch)
			throw new Error("There is already an active batch");

		this.emit("batch:started", batch);
		this.state.activeBatch = batch;

		const tasks = batch.extractTasks();

		for (const task of tasks) {
			try {
				await this.delegateTaskToWorker(task, this.state.workerNodes[0]);
			} catch (error) {
				if (error instanceof WorkerNotAvailableError) {
					// requeue the task
					console.warn("No worker available for task:", task.id);
					continue;
				}
				// TODO:: Handle task delegation failure
				console.error(`Failed to delegate task ${task.id}:`, error);
			}
		}
	}
}

export const createManagerNode = async (bootstrapNodes: string[] = []) => {
	const node = await createLibp2p({
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		connectionGater: {
			denyDialMultiaddr: async () => false,
		},
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
			circuitRelayTransport({
				
			}),
		],
		peerDiscovery: [
			workerPubSubPeerDiscovery({
				type: "manager",
			}),
			bootstrap({
				list: bootstrapNodes,
			}),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			identify: identify(),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
		},
	});

	node.addEventListener("peer:discovery", ({ detail }) => {
		console.log("Manager Discovered:", detail);
	});

	return new ManagerNode(node);
};
