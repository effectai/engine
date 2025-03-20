import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
	type TypedEventTarget,
	type Libp2pEvents,
	type ComponentLogger,
	type PeerStore,
	type PeerId,
	Stream,
	Connection,
} from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";

import { MessageStream, pbStream } from "it-protobuf-stream";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "./consts.js";

import type { Datastore } from "interface-datastore";

import {
	type PaymentMessage,
	type Task,
	TaskMessage,
	TaskStatus,
	WorkerMessage,
} from "./workerMessage.js";

import {
	MULTICODEC_MANAGER_PROTOCOL_NAME,
	MULTICODEC_MANAGER_PROTOCOL_VERSION,
} from "../manager/consts.js";
import { ManagerMessage } from "../manager/managerMessage.js";
import { PaymentProtocolService } from "../payment/service.js";
import { TaskProtocolService } from "../task/service.js";
import { getOrCreateActiveOutBoundStream } from "../utils/utils.js";
import { Payment } from "../payment/payment.js";

export interface WorkerProtocolEvents {
	"task:received": CustomEvent<Task>;
	"task:sent": CustomEvent<Task>;
	"payment:received": CustomEvent<PaymentMessage>;
}

export interface WorkerProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
	datastore: Datastore;
	peerStore: PeerStore;
	peerId: PeerId;
	privateKey: PrivateKey;
}

export class WorkerProtocolService
	extends TypedEventEmitter<WorkerProtocolEvents>
	implements Startable
{
	private taskService: TaskProtocolService;
	private paymentService: PaymentProtocolService;

	//TODO:: retrieve current nonce based on manager requesting it.
	private nonce = BigInt(1);

	constructor(private components: WorkerProtocolComponents) {
		super();
		this.taskService = new TaskProtocolService(components);
		this.paymentService = new PaymentProtocolService(components);
	}

	start(): void | Promise<void> {
		this.register();
	}

	stop(): void | Promise<void> {}

	async register() {
		this.components.registrar.handle(
			`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			this.handleProtocol.bind(this),
			{ runOnLimitedConnection: false },
		);
	}

	async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(WorkerMessage);
		const workerMessage = await pb.read();

		if (workerMessage.payment) {
			this.handlePaymentMessage(
				data.connection.remotePeer.toString(),
				pb,
				workerMessage.payment,
			);
		} else if (workerMessage.task) {
			this.handleTaskMessage(workerMessage.task);
		}
	}

	async getTasks() {
		return await this.taskService.getTasks();
	}

	//request a payment from a manager for time spent on the network.
	async requestPayout(managerPeerId: PeerId) {
		try {
			const stream = await getOrCreateActiveOutBoundStream(
				managerPeerId.toString(),
				this.components.connectionManager,
				`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(ManagerMessage);

			const paymentMessage: ManagerMessage = {
				payment: {
					payoutRequest: {
						peerId: this.components.peerId.toString(),
					},
				},
			};

			await pb.write(paymentMessage);

			// Wait for the manager's response
			const response = await pb.read();

			// Ensure we received a payment
			if (response.payment?.payment) {
				console.log("received payment from manager", response.payment.payment);
			}

			return null;
		} catch (error) {
			console.error(`Failed to request payment from ${managerPeerId}:`, error);
			return;
		}
	}

	async handleTaskMessage(task: Task) {
		await this.taskService.storeTask(task);
		this.safeDispatchEvent("task:received", { detail: task });
	}

	async handlePaymentMessage(
		remotePeer: string,
		stream: MessageStream<WorkerMessage>,
		paymentMessage: PaymentMessage,
	) {
		if (paymentMessage.requestNonce) {
			const nonceResponse: WorkerMessage = {
				payment: {
					nonceResponse: {
						nonce: this.nonce,
					},
				},
			};

			await stream.write(nonceResponse);
		} else if (paymentMessage.payment) {
			await this.paymentService.storePayment(
				remotePeer,
				paymentMessage.payment,
			);

			this.safeDispatchEvent("payment:received", {
				detail: paymentMessage,
			});
		}
	}

	//request a payment proof from a manager peer
	async requestPaymentProof(peerId: PeerId, payments: Payment[]) {
		try {
			const connection =
				this.components.connectionManager.getConnections(peerId)[0];

			const stream = await connection.newStream(
				`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(ManagerMessage);

			const paymentProofMessage: ManagerMessage = {
				payment: {
					proofRequest: {
						batchSize: payments.length,
						payments,
					},
				},
			};

			await pb.write(paymentProofMessage);

			// Wait for the manager's response
			const response = await pb.read();

			// Ensure we received a proof
			if (response.payment?.proofResponse) {
				//TODO:: store the proof / send it to smart contract.
				console.log("response", response.payment.proofResponse);
				await stream.close();
				return response.payment.proofResponse;
			}

			return null;
		} catch (error) {
			console.error(`Failed to request proof from ${peerId}:`, error);
			return null;
		}
	}

	async acceptTask(task: Task) {
		task.status = TaskStatus.ACCEPTED;
		await this.taskService.storeTask(task);

		const managerMessage: ManagerMessage = {
			task: {
				taskId: task.taskId,
				taskAccepted: this.taskService.createTaskAcceptedMessage(task),
			},
		};

		await this.sendManagerMessage(task.manager, managerMessage);
	}

	async rejectTask(task: Task) {
		task.status = TaskStatus.REJECTED;
		await this.taskService.storeTask(task);
		const managerMessage: ManagerMessage = {
			task: {
				taskId: task.taskId,
				taskRejected: {
					taskId: task.taskId,
					worker: this.components.peerId.toString(),
					reason: "Task Rejected",
					timestamp: Date.now().toString(),
				},
			},
		};

		await this.sendManagerMessage(task.manager, managerMessage);
	}

	async completeTask(taskId: string, result: string) {
		const task = await this.taskService.getTask(taskId);

		if (!task || !task.manager) {
			throw new Error("Task does not have a manager");
		}

		task.status = TaskStatus.COMPLETED;
		task.result = result;

		await this.taskService.storeTask(task);

		const managerMessage: ManagerMessage = {
			task: {
				taskId: task.taskId,
				taskCompleted: this.taskService.createTaskCompletedMessage(task),
			},
		};

		await this.sendManagerMessage(task.manager, managerMessage);
	}

	async getPayments() {
		const payments = await this.paymentService.getPayments();
		return payments;
	}

	async sendManagerMessage(peerId: string, message: ManagerMessage) {
		try {
			const stream = await getOrCreateActiveOutBoundStream(
				peerId,
				this.components.connectionManager,
				`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(ManagerMessage);
			await pb.write(message);
			await stream.close();
		} catch (e) {
			console.error("Error sending payment", e);
		} finally {
		}
	}
}

export function workerProtocol(): (
	components: WorkerProtocolComponents,
) => WorkerProtocolService {
	return (components: WorkerProtocolComponents) =>
		new WorkerProtocolService(components);
}
