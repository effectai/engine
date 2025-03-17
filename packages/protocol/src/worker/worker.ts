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
import { getActiveOutBoundConnections } from "../utils/utils.js";

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
}

export class WorkerProtocolService
	extends TypedEventEmitter<WorkerProtocolEvents>
	implements Startable
{
	private taskService: TaskProtocolService;
	private paymentService: PaymentProtocolService;

	//TODO::
	// private challengeService: ChallengeProtocolService;

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

	async handleTaskMessage(task: Task) {
		this.safeDispatchEvent("task:received", { detail: task });
	}

	async handlePaymentMessage(
		remotePeer: string,
		stream: MessageStream<WorkerMessage>,
		paymentMessage: PaymentMessage,
	) {
		if (paymentMessage.requestNonce) {
			//send a nonce response
			const nonceResponse: WorkerMessage = {
				payment: {
					nonceResponse: {
						nonce: BigInt(500),
					},
				},
			};

			await stream.write(nonceResponse);
		} else if (paymentMessage.nonceResponse) {
		} else if (paymentMessage.signedPayment) {
			console.log("recieved signed payment", paymentMessage.signedPayment);
			//store payment
			await this.paymentService.storePayment(
				remotePeer,
				paymentMessage.signedPayment,
			);
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

	async rejectTask(task: Task) {}

	async completeTask(task: Task, result: string) {
		if (!task.manager) {
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
		return this.paymentService.getPayments();
	}

	async sendManagerMessage(peerId: string, message: ManagerMessage) {
		try {
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
				`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(ManagerMessage);
			await pb.write(message);
		} catch (e) {
			console.error("Error sending payment", e);
		}
	}
}

export function workerProtocol(): (
	components: WorkerProtocolComponents,
) => WorkerProtocolService {
	return (components: WorkerProtocolComponents) =>
		new WorkerProtocolService(components);
}
