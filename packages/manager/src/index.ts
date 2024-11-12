import {
	type TaskFlowMessage,
	type Stream,
	type Multiaddr,
	type Libp2p,
	type NodeEventMap,
	type Task,
	Batch,
	Libp2pNode,
	createLibp2p,
	webSockets,
	webRTC,
	circuitRelayTransport,
	noise,
	yamux,
	identify,
	filters,
	pubSubPeerDiscovery,
	bootstrap,
	gossipsub,
	multiaddr,
	type Peer,
} from "@effectai/task-core";
import { pipe } from "it-pipe";
import { PeerType } from "../../core/dist/discovery/pubsub/peer.js";

export class WorkerNotAvailableError extends Error {
	constructor() {
		super("No worker available");
	}
}

export type TaskStatus = "pending" | "accepted" | "completed";

export type ManagerState = {
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
		super(node, {
			activeBatch: null,
			taskMap: new Map(),
		});

		// listen for batches
		this.handleBatchMessage();
	}

	// TODO:: Implement worker node selection strategy
	async selectWorkerNode(): Promise<Peer | null> {
		const peers = await this.node.peerStore.all();

		// get all active worker peers
		const workerPeers = peers.filter(
			(peer) => peer.tags.get("peerType")?.value === PeerType.Worker,
		);

		// return the first worker peer
		return workerPeers[0] || null;
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

	handleBatchMessage() {
		this.node.handle("/effect-ai/task/1.0.0", async ({ stream }) => {
			pipe(stream.source, async (source) => {
				for await (const msg of source) {
					const { t, d } = JSON.parse(new TextDecoder().decode(msg.subarray()));
					// handle batch message
					if (t === "batch") {
						const batch = new Batch(d);
						// send accept message
						const acceptMessage = JSON.stringify({
							t: "batch-accepted",
							d: null,
						});

						await stream.sink([new TextEncoder().encode(acceptMessage)]);

						await this.processBatch(batch);
					}
				}
			});
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
				console.log("Task rejected by worker:", d.id);
				// TODO:: requeue the task
				break;
			case "task-accepted":
				console.log("Task accepted by worker:", d.id);
				this.setState({
					...this.state,
					taskMap: new Map([
						...this.state.taskMap,
						[
							task.id,
							{
								activeWorkerPeerId: streamPeerId,
								status: "accepted",
								updatedAt: new Date(),
							},
						],
					]),
				});
				break;
			case "task-completed":
				console.log("Manager: Task completed by worker:", d.id);
				task.result = d.result;
				this.setState({
					...this.state,
					taskMap: new Map([
						...this.state.taskMap,
						[
							task.id,
							{
								activeWorkerPeerId: streamPeerId,
								status: "completed",
								updatedAt: new Date(),
							},
						],
					]),
				});
				this.emit("task:completed", task);
				break;
			default:
				console.warn("Unknown task response:", t);
		}
	}

	async delegateTaskToWorker(task: Task, worker: Peer) {
		// create a stream to the worker
		console.log("Delegating task to worker:", task.id);
		const { stream, workerPeerId } = await this.createTaskStream(task, worker);
		this.handleTaskResponse(workerPeerId, stream, task);
	}

	async createTaskStream(task: Task, worker: Peer) {
		if (!this.node) {
			throw new Error("Node not initialized");
		}

		let connection = this.node.getConnections(worker.id)[0];

		if (!connection) {
			console.log("Dialing worker:", worker.id);
			connection = await this.node.dial(worker.id);
		}

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
		this.setState({ ...this.state, activeBatch: batch });

		const tasks = batch.extractTasks();

		for (const task of tasks) {
			try {
				const worker = await this.selectWorkerNode();

				if (!worker) {
					console.warn("No worker available for task:", task.id);
					continue;
				}

				await this.delegateTaskToWorker(task, worker);
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
			circuitRelayTransport({}),
		],
		peerDiscovery: [
			pubSubPeerDiscovery({
				type: PeerType.Manager,
				topics: ["manager-worker-discovery", "provider-manager-discovery"],
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

	return new ManagerNode(node);
};
