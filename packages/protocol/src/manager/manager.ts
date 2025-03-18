import {
	type ComponentLogger,
	type Connection,
	type Libp2pEvents,
	type PeerId,
	type PeerStore,
	type PrivateKey,
	type Startable,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";

import { buildEddsa } from "circomlibjs";

import * as snarkjs from "snarkjs";
import { MessageStream, pbStream } from "it-protobuf-stream";

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
	bigIntToUint8Array,
	getOrCreateActiveOutBoundStream,
	uint8ArrayToBigInt,
} from "../utils/utils.js";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "../worker/consts.js";
import { WorkerMessage } from "../worker/workerMessage.js";
import {
	type PaymentMessage,
	type Task,
	ManagerMessage,
	type TaskMessage,
	TaskStatus,
} from "./managerMessage.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { WorkerQueue } from "./queue.js";
import { RequestNonce } from "../payment/payment.js";
import { PaymentProtocolService } from "../payment/service.js";
import { PublicKey } from "@solana/web3.js";

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
	private readonly workerQueue: WorkerQueue;
	private readonly paymentService: PaymentProtocolService;

	constructor(private components: ManagerServiceComponents) {
		super();
		this.paymentService = new PaymentProtocolService(components);
		this.taskService = new TaskProtocolService(components);
		this.workerQueue = new WorkerQueue(components);
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
					// request nonce from newly identified worker
					const nonce = await this.requestNonce(
						detail.peerId.toString(),
						detail.connection,
					);

					if (!nonce) {
						console.error("Failed to get nonce from worker");
						return;
					}

					const timestamp = Math.floor(new Date().getTime() / 1000); // Convert to integer (seconds)
					const buffer = Buffer.alloc(4); // 4 bytes for a 32-bit integer
					buffer.writeUInt32BE(timestamp, 0);
					//save nonce in metadata of peer
					this.components.peerStore.merge(detail.peerId, {
						metadata: {
							timeSinceLastPayout: buffer,
							nonce: bigIntToUint8Array(nonce),
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
		if (!nonce) return null;
		return uint8ArrayToBigInt(new Uint8Array(nonce));
	}

	async requestNonce(
		peerId: string,
		connection: Connection,
	): Promise<bigint | null> {
		try {
			console.log("requesting nonce from worker", peerId);
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
				console.log("nonce response", response.payment.nonceResponse.nonce);
				await stream.close();
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
			await this.handlePaymentMessage(
				data.connection.remotePeer.toString(),
				pb,
				message.payment,
			);
		} else if (message.task) {
			await this.handleTaskMessage(
				data.connection.remotePeer.toString(),
				message.task,
			);
		}

		await data.stream.close();
	}

	private async handlePaymentMessage(
		remotePeer: string,
		stream: MessageStream<ManagerMessage>,
		payment: PaymentMessage,
	) {
		if (payment.proofRequest) {
			const proof = await this.generatePaymentProof(payment.proofRequest);

			const message: WorkerMessage = {
				payment: {
					proofResponse: {
						piA: proof.pi_a,
						piB: [
							{ row: [proof.pi_b[0][0], proof.pi_b[0][1]] },
							{ row: [proof.pi_b[1][0], proof.pi_b[1][1]] },
							{ row: [proof.pi_b[2][0], proof.pi_b[2][1]] },
						],
						piC: proof.pi_c,
						protocol: proof.protocol,
						curve: proof.curve,
					},
				},
			};

			await stream.write(message);
		} else if (payment.payoutRequest) {
			console.log("payoutRequest", payment.payoutRequest);
			const peer = peerIdFromString(remotePeer);
			const peerData = await this.components.peerStore.get(peer);
			const timeSinceLastPayout =
				peerData.metadata.get("timeSinceLastPayout") ?? 0;

			//convert buffered timestamp to number
			const recoveredTimestamp = timeSinceLastPayout.readUInt32BE(0);
			console.log("Recovered Timestamp:", recoveredTimestamp);

			console.log("timeSinceLastPayout", timeSinceLastPayout);
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

	private async handleTaskMessage(peerId: string, taskMessage: TaskMessage) {
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
			this.generatePayment(peerId, task);
		}

		await this.taskService.storeTask(task);
	}

	private async generatePayment(peerId: string, task: Task) {
		//get current nonce for this peerId
		const nonce = await this.retrieveNonce(peerId);

		const payment = await this.paymentService.generatePayment(
			peerId,
			Number.parseFloat(task.reward),
			nonce ?? BigInt(0),
			new PublicKey("5cvmp5heVgetZxYhQuqyR6k3NNs8iv6YAChiJdj4dbh7"),
		);

		// add 1 to worker nonce
		await this.components.peerStore.merge(peerIdFromString(peerId), {
			metadata: {
				nonce: bigIntToUint8Array(nonce + BigInt(1)),
			},
		});

		//send payment to worker
		const paymentMessage: WorkerMessage = {
			payment: {
				payment: payment,
			},
		};

		await this.sendWorkerMessage(peerId, paymentMessage);
	}

	private async generatePaymentProof(message: PaymentMessage["proofRequest"]) {
		const eddsa = await buildEddsa();
		const pubKey = eddsa.prv2pub(this.components.privateKey.raw.slice(0, 32));

		if (!message) {
			console.error("No proof request found");
			return;
		}

		const proofInputs = {
			receiver: int2hex(new PublicKey(message.payments[0].recipient)._bn),
			pubX: eddsa.F.toObject(pubKey[0]),
			pubY: eddsa.F.toObject(pubKey[1]),
			nonce: message.payments.map((p) => int2hex(p.nonce)),
			payAmount: message.payments.map((p) => int2hex(p.amount)),
			R8x: message.payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_1)),
			R8y: message.payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_2)),
			S: message.payments.map((s) => BigInt(s.signature?.S)),
		};

		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			proofInputs,
			"../../zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
			"../../zkp/circuits/PaymentBatch_0001.zkey",
		);

		return proof;
	}

	private async sendWorkerMessage(peerId: string, message: WorkerMessage) {
		try {
			// console.log("Sending message to worker", peerId, message);
			const stream = await getOrCreateActiveOutBoundStream(
				peerId,
				this.components.connectionManager,
				`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(WorkerMessage);
			await pb.write(message);

			await stream.close();

			return {
				peer: peerId,
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
