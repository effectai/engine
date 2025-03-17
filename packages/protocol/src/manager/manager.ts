import {
	type ComponentLogger,
	Connection,
	type Libp2pEvents,
	type PeerId,
	type PeerStore,
	type PrivateKey,
	type Startable,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import { handshake } from "it-handshake";

import type {
	Registrar,
	ConnectionManager,
	IncomingStreamData,
} from "@libp2p/interface-internal";
import type { Datastore } from "interface-datastore";

import {
	MULTICODEC_MANAGER_PROTOCOL_NAME,
	MULTICODEC_MANAGER_PROTOCOL_VERSION,
} from "./consts.js";
import { TaskProtocolService } from "../task/service.js";
import {
	getActiveOutBoundConnections,
	getOrCreateConnection,
} from "../utils/utils.js";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "../worker/consts.js";
import { WorkerMessage } from "../worker/workerMessage.js";
import {
	PaymentMessage,
	type Task,
	ManagerMessage,
	type TaskMessage,
	TaskStatus,
} from "./managerMessage.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { WorkerTaskQueue } from "../task/queue.js";
import { RequestNonce } from "../payment/payment.js";

export const int2hex = (i: string | number | bigint | boolean) =>
	`0x${BigInt(i).toString(16)}`;

export interface ManagerServiceComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	peerId: PeerId;
	privateKey: PrivateKey;
	logger: ComponentLogger;
}

export interface ManagerServiceEvents {
	"task:received": CustomEvent<Task>;
	"task:completed": CustomEvent<Task>;
}

export class ManagerService
	extends TypedEventEmitter<ManagerServiceEvents>
	implements Startable
{
	private readonly taskService: TaskProtocolService;
	private readonly workerQueue: WorkerTaskQueue;

	constructor(private components: ManagerServiceComponents) {
		super();
		this.taskService = new TaskProtocolService(components);
		this.workerQueue = new WorkerTaskQueue(components);
	}

	start(): void | Promise<void> {
		this.register();

		this.components.events.addEventListener(
			"peer:identify",
			async ({ detail }) => {
				if (
					detail.protocols.includes(
						`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
					)
				) {
					//request nonce from newly identified worker
					const nonce = await this.requestNonce(
						detail.peerId.toString(),
						detail.connection,
					);

					if (!nonce) {
						console.error("Failed to get nonce from worker");
						return;
					}

					//save nonce in metadata of peer
					this.components.peerStore.merge(detail.peerId, {
						metadata: {
							nonce: Buffer.from(nonce),
						},
					});

					this.workerQueue.enqueue(detail.peerId.toString());
				}
			},
		);
	}

	async retrieveNonce(peerId: string): Promise<bigint | null> {
		const peer = peerIdFromString(peerId);
		const peerData = await this.components.peerStore.get(peer);
		const nonce = peerData.metadata.get("nonce");
		console.log("nonce", nonce);
		return null;
	}

	async requestNonce(
		peerId: string,
		connection: Connection,
	): Promise<string | null> {
		try {
			const stream = await connection.newStream(
				`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(WorkerMessage);

			// Send the nonce request
			await pb.write({
				payment: {
					requestNonce: {
						peerId: this.components.peerId.toString(),
					},
				},
			});

			// Wait for the worker's response
			const response = await pb.read();

			// Ensure we received a nonce
			if (response.payment?.nonceResponse) {
				console.log(
					`Received nonce from ${peerId}: ${response.payment.nonceResponse.nonce}`,
				);
				return response.payment.nonceResponse.nonce;
			}

			return null;
		} catch (error) {
			console.error(`Failed to request nonce from ${peerId}:`, error);
			return null;
		}
	}

	stop(): void | Promise<void> {}

	private async register() {
		this.components.registrar.handle(
			`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			this.handleProtocol.bind(this),
			{ runOnLimitedConnection: false },
		);
	}

	private async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(ManagerMessage);
		const message = await pb.read();

		if (message.payment) {
			this.handlePaymentMessage(message.payment);
		} else if (message.task) {
			this.handleTaskMessage(message.task);
		}
	}

	public async processTask(task: Task) {
		task.manager = this.components.peerId.toString();
		await this.taskService.storeTask(task);
		//get worker from queue
		const worker = this.workerQueue.dequeue();

		if (!worker) {
			console.error("No worker available");
			return;
		}

		//send task to worker
		const taskMessage: WorkerMessage = {
			task: task,
		};

		return this.sendWorkerMessage(worker, taskMessage);
	}

	public async getTasks() {
		return this.taskService.getTasks();
	}

	private async handleTaskMessage(taskMessage: TaskMessage) {
		//retrieve task from task store
		const task = await this.taskService.getTask(taskMessage.taskId);

		if (!task) {
			console.error("Task not found");
			return;
		}

		if (taskMessage.taskAccepted) {
			//task accepted by worker
			task.status = TaskStatus.ACCEPTED;
		} else if (taskMessage.taskRejected) {
			//task rejected by worker
			task.status = TaskStatus.REJECTED;
		} else if (taskMessage.taskCompleted) {
			//task completed by worker
			task.status = TaskStatus.COMPLETED;
			task.result = taskMessage.taskCompleted.result;
			//TODO:: generate payment and send it.
			this.generatePayment(task);
		}

		await this.taskService.storeTask(task);
	}

	private async generatePayment(task: Task) {}

	private async handlePaymentMessage(payment: PaymentMessage) {}

	private async sendWorkerMessage(peerId: string, message: WorkerMessage) {
		try {
			// console.log("Sending message to worker", peerId, message);
			const peer = peerIdFromString(peerId);

			let [connection] = await getActiveOutBoundConnections(
				this.components.connectionManager,
				peer,
			);

			if (!connection) {
				connection =
					await this.components.connectionManager.openConnection(peer);
			}

			const stream = await connection.newStream(
				`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(WorkerMessage);
			await pb.write(message);

			return {
				peer,
				message,
			};
		} catch (e) {
			console.error("Error sending message to worker", e);
		}
	}
}

export function managerProtocol(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
