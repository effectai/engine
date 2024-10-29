import { Uint8ArrayList } from "uint8arraylist";
import {
	Libp2pNode,
	Task,
	type TaskFlowMessage,
	type TaskPayload,
	filters,
	createLibp2p,
	yamux,
	webSockets,
	webRTC,
	noise,
	circuitRelayTransport,
	identify,
	identifyPush,
	type NodeEventMap,
	type Libp2p,
	kadDHT,
	removePrivateAddressesMapper,
	gossipsub,
	workerPubSubPeerDiscovery,
	bootstrap,
	type Stream,
} from "@effectai/task-core";

export enum STATUS {
	IDLE = "idle",
	BUSY = "busy",
}

export type WorkerState = {
	status: STATUS;
	activeTask: Task | null;
	incomingTasks: Map<string, {stream: Stream, task: Task}>;
};

export interface WorkerEvents extends NodeEventMap<WorkerState> {
	"incoming-task": TaskPayload;
	"accept-task": Task;
	"reject-task": Task;
}

export class WorkerNode extends Libp2pNode<WorkerState, WorkerEvents> {
	private activeTaskStream: Stream | null = null;

	constructor(node: Libp2p) {
		super({
			status: STATUS.IDLE,
			activeTask: null,
			incomingTasks: new Map(),
		});
		this.node = node;
	}

	async rejectTask(task: Task) {
		this.emit("reject-task", task);
		// remove task from incoming tasks
		this.setState({
			...this.state,
			incomingTasks: new Map(
				[...this.state.incomingTasks].filter(([id]) => id !== task.id),
			),
		})
		return true;
	}

	async acceptTask(task: Task) {
		if (this.state.status === STATUS.BUSY) {
			console.warn("Worker is busy, cannot accept task");
			return false;
		}

		this.setState({
			...this.state,
			status: STATUS.BUSY,
			activeTask: task,
		});

		this.emit("accept-task", task);

		// get the task from the incoming tasks and accept it
		const incomingTask = this.state.incomingTasks.get(task.id);
		
		if(!incomingTask) {
			console.warn("Task not found in incoming tasks");
			return false;
		}

		this.activeTaskStream = incomingTask?.stream;

		return true;
	}

	async closeActiveStream() {
		// await this.activeTaskStream?.close();
		this.activeTaskStream = null;
	}

	async submitTask(task: Task) {
		console.log("Worker submitted task", task);
		
		this.setState({
			...this.state,
			status: STATUS.IDLE,
			activeTask: null,
		});

		// send the task to the manager
		const message = JSON.stringify({
			t: "task-completed",
			d: {
				id: task.id,
				result: task.result,
			},
		});

		await this.activeTaskStream?.sink([new TextEncoder().encode(message)]);

		// remove the task from the incoming tasks
		this.setState({
			...this.state,
			incomingTasks: new Map(
				[...this.state.incomingTasks].filter(([id]) => id !== task.id),
			),
		})

		await this.closeActiveStream();
	}

	async listenForTask() {
		this.node?.handle("/task-flow/1.0.0", async (streamData) => {
			const data = new Uint8ArrayList();

			for await (const chunk of streamData.stream.source) {
				data.append(chunk);
			}

			const messageFromManager = JSON.parse(
				new TextDecoder().decode(data.subarray()),
			) as TaskFlowMessage;

			switch (messageFromManager.t) {
				case "task": {
					const payload = messageFromManager.d as TaskPayload;
					const task = Task.fromPayload(payload);
					
					this.setState({
						...this.state,
						incomingTasks: new Map([...this.state.incomingTasks, [task.id, {stream: streamData.stream, task}]]),
					})

					this.emit("incoming-task", task);

					if (this.state.status === STATUS.BUSY) {
						this.rejectTask(task);
					}
					break;
				}
			}
		});
	}
}

export const createWorkerNode = async (bootstrapNodes: string[] = []) => {
	const node = await createLibp2p({
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		connectionGater: {
			denyDialMultiaddr: async () => false,
		},
		peerDiscovery: [
			workerPubSubPeerDiscovery({
				type: "worker",
			}),
			bootstrap({
				list: bootstrapNodes,
			}),
		],
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
			circuitRelayTransport({}),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			identify: identify({}),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
		},
	});

	// set mode to server
	node.addEventListener("peer:discovery", (peer) => {
		console.log("Worker Discovered:", peer.detail);
	});

	const workerNode = new WorkerNode(node);

	return workerNode;
};
