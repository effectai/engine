import {
	type ComponentLogger,
	type Connection,
	IdentifyResult,
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
	int2hex,
	isWorker,
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
import { PaymentProtocolService } from "../payment/service.js";
import { PublicKey } from "@solana/web3.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type WorkerMeta = {
	nonce: bigint;
	delegate: PublicKey;
};

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

	async pairWorker(result: CustomEvent<IdentifyResult>["detail"]) {
		try {
			const eddsa = await buildEddsa();
			const key = eddsa.prv2pub(this.components.privateKey.raw.slice(0, 32));

			const message: WorkerMessage = {
				session: {
					manager: {
						pubX: key[0],
						pubY: key[1],
					},
				},
			};

			const stream = await getOrCreateActiveOutBoundStream(
				result.peerId.toString(),
				this.components.connectionManager,
				`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(WorkerMessage);
			await pb.write(message);
			const response = await pb.read();
			//close stream
			await stream.close();

			const timestamp = Math.floor(new Date().getTime() / 1000); // Convert to integer (seconds)
			const buffer = Buffer.alloc(4); // 4 bytes for a 32-bit integer
			buffer.writeUInt32BE(timestamp, 0);

			if (!response.session?.worker?.nonce) {
				console.error("No nonce found for worker, skipping pairing..");
				return;
			}

			this.components.peerStore.merge(result.peerId, {
				metadata: {
					timeSinceLastPayout: buffer,
					nonce: bigIntToUint8Array(response.session?.worker?.nonce),
					delegate: response.session?.worker?.delegate,
				},
			});

			this.workerQueue.enqueue(result.peerId.toString());
		} catch (e) {
			console.error("Error pairing worker", e);
		} //TODO:: sned an ack to worker that it has been paired
	}

	start(): void | Promise<void> {
		this.register();

		this.components.events.addEventListener(
			"peer:identify",
			async ({ detail }) => {
				//check if peer is a worker
				if (isWorker(detail)) {
					await this.pairWorker(detail);
				}
			},
		);
	}

	async retrieveWorkerMeta(peerId: string): Promise<WorkerMeta> {
		try {
			const peer = peerIdFromString(peerId);
			const peerData = await this.components.peerStore.get(peer);

			if (!peerData) {
				throw new Error(`No peer data found for peerId: ${peerId}`);
			}

			const nonce = peerData.metadata.get("nonce");
			if (!nonce) {
				throw new Error(`No nonce found for worker with peerId: ${peerId}`);
			}

			const delegate = peerData.metadata.get("delegate");
			if (!delegate) {
				throw new Error(`No delegate found for worker with peerId: ${peerId}`);
			}

			return {
				nonce: uint8ArrayToBigInt(new Uint8Array(nonce)),
				delegate: new PublicKey(delegate),
			};
		} catch (error) {
			console.error("Error retrieving worker meta", error);
			throw error;
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
			try {
				const { proof, publicSignals, pubKey } =
					await this.generatePaymentProof(payment.proofRequest);

				const message: WorkerMessage = {
					payment: {
						proofResponse: {
							R8: {
								R8_1: pubKey[0],
								R8_2: pubKey[1],
							},
							signals: {
								minNonce: publicSignals[0],
								maxNonce: publicSignals[1],
								amount: BigInt(publicSignals[2]),
							},
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
			} catch (e) {
				console.error("Error generating payment proof", e);
			}
		} else if (payment.payoutRequest) {
			const peer = peerIdFromString(remotePeer);
			const peerData = await this.components.peerStore.get(peer);
			const timeSinceLastPayout = peerData.metadata.get("timeSinceLastPayout");

			if (!timeSinceLastPayout) {
				console.error("No timeSinceLastPayout found");
				return;
			}

			const recoveredTimestamp = new DataView(
				new Uint8Array(timeSinceLastPayout).buffer,
			).getUint32(0, false);

			const payoutTimeInSeconds =
				Math.floor(new Date().getTime() / 1000) - recoveredTimestamp;

			const payment = await this.generatePayment(
				remotePeer,
				BigInt(payoutTimeInSeconds * 1_000_00),
			);

			const timestamp = Math.floor(new Date().getTime() / 1000);
			const buffer = Buffer.alloc(4);
			buffer.writeUInt32BE(timestamp, 0);

			//update last payout time
			await this.components.peerStore.merge(peer, {
				metadata: {
					timeSinceLastPayout: buffer,
				},
			});

			if (!payment) {
				//TODO:: error logging
				console.error("error generating payment");
				return;
			}

			await stream.write(payment);
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

			if (task.status === TaskStatus.COMPLETED) {
				console.error("Task already completed");
				return;
			}

			task.status = TaskStatus.COMPLETED;
			task.result = taskMessage.taskCompleted.result;

			//TODO:: generate payment and send it.
			const paymentMessage = await this.generatePayment(peerId, task.reward);

			if (!paymentMessage) {
				//TODO:: LOGGING/ERROR HANDLING
				console.error("couldnt generate payment..");
				return;
			}

			await this.sendWorkerMessage(peerId, paymentMessage);
		}

		await this.taskService.storeTask(task);
	}

	public acceptTask() {}

	public getQueue() {
		return this.workerQueue.getQueue();
	}

	private async generatePayment(peerId: string, amount: bigint) {
		//get current nonce for this peerId
		const { nonce, delegate } = await this.retrieveWorkerMeta(peerId);

		console.log("delegate", delegate.toBase58());

		const payment = await this.paymentService.generatePayment(
			peerId,
			amount,
			nonce ?? BigInt(0),
			new PublicKey("EFcxXsFYMKP1HfEHEmSrSZtV2fKhJzEfC44h4KWZZ9cm"),
			new PublicKey(delegate),
		);

		if (!nonce) {
			console.error("No nonce found for worker, skipping payment..");
			return;
		}

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

		return paymentMessage;
	}

	private async generatePaymentProof(message: PaymentMessage["proofRequest"]) {
		try {
			const eddsa = await buildEddsa();
			const pubKey = eddsa.prv2pub(this.components.privateKey.raw.slice(0, 32));

			if (!message) {
				throw new Error("No payment message found");
			}

			//TODO:: make this dynamic
			const maxBatchSize = 10;
			const batchSize = message.payments.length;
			const enabled = Array(maxBatchSize).fill(0);
			enabled.fill(1, 0, batchSize);

			console.log(
				"generating proof for: ",
				message.payments.length,
				" payments",
			);

			const padArray = <T>(arr: T[], defaultValue: T): T[] =>
				arr
					.concat(Array(maxBatchSize - arr.length).fill(defaultValue))
					.slice(0, maxBatchSize);

			const uniqueRecipients = new Set(
				message.payments.map((p) => p.recipient),
			);

			if (uniqueRecipients.size > 1) {
				throw new Error("Only one recipient is supported");
			}

			//sort payments by nonce
			const payments = message.payments.toSorted((a, b) =>
				Number(a.nonce - b.nonce),
			);

			const proofInputs = {
				receiver: int2hex(
					new PublicKey(message.payments[0]?.recipient || "0")
						.toBuffer()
						.readBigInt64BE(),
				),
				pubX: eddsa.F.toObject(pubKey[0]),
				pubY: eddsa.F.toObject(pubKey[1]),
				nonce: padArray(
					payments.map((p) => int2hex(Number(p.nonce))),
					//fill with max nonce
					int2hex(payments[message.payments.length - 1].nonce),
				),
				enabled: enabled,
				payAmount: padArray(
					payments.map((p) => int2hex(p.amount)),
					"0",
				),
				R8x: padArray(
					payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_1)),
					0,
				),
				R8y: padArray(
					payments.map((s) => eddsa.F.toObject(s.signature?.R8?.R8_2)),
					0,
				),
				S: padArray(
					payments.map((s) => BigInt(s.signature?.S || 0)),
					BigInt(0),
				),
			};

			const __filename = fileURLToPath(import.meta.url);
			const __dirname = path.dirname(__filename);

			const wasmPath = path.resolve(
				__dirname,
				"../../../../zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
			);
			const zkeyPath = path.resolve(
				__dirname,
				"../../../../zkp/circuits/PaymentBatch_0001.zkey",
			);

			const { proof, publicSignals } = await snarkjs.groth16.fullProve(
				proofInputs,
				wasmPath,
				zkeyPath,
			);

			console.log("proof", proof);

			return { proof, publicSignals, pubKey };
		} catch (e) {
			console.error("Error generating payment proof", e);
			throw e;
		}
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
