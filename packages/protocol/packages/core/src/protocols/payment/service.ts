import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
	type ComponentLogger,
	Libp2pEvents,
	TypedEventTarget,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { Payment } from "./pb/payment.js";
import type { Task } from "../task/index.js";
import { publicKeyFromRaw } from "@libp2p/crypto/keys";
import { PaymentStore } from "./store.js";
import type { Datastore } from "interface-datastore";
import { getActiveOutBoundConnections } from "../../utils.js";

export type PaymentProtocolEvents = {
	"payment:sent": CustomEvent<Payment>;
	"payment:received": CustomEvent<Payment>;
};

export interface PaymentProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export class PaymentProtocolService
	extends TypedEventEmitter<PaymentProtocolEvents>
	implements Startable
{
	private readonly components: PaymentProtocolComponents;
	private readonly store: PaymentStore;

	constructor(components: PaymentProtocolComponents) {
		super();
		this.components = components;
		this.store = new PaymentStore(this.components);
		this.start();
	}

	async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(Payment);
		const payment = await pb.read();
		this.safeDispatchEvent("payment:received", { detail: payment });
	}

	async start(): Promise<void> {
		this.components.registrar.handle(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			this.handleProtocol.bind(this),
			{ runOnLimitedConnection: false },
		);
	}

	async getPayments(): Promise<Payment[]> {
		return await this.store.all();
	}

	async generatePayment(peerId: string, task: Task) {
		//generate a payment from a completed task

		//TODO:: checks:
		// @TaskNotCompleted
		// @TaskAlreadyPaid

		const pid = peerIdFromString(peerId);

		if (!pid.publicKey) {
			throw new Error("PeerId does not have a public key");
		}

		//TODO:: map to solana publicKey
		const publicKey = publicKeyFromRaw(pid.publicKey.raw);

		//TODO:: figure out what nonce?
		const nonce = 0;

		const payment = Payment.encode({
			id: task.id,
			mint: "EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E",
			recipient: publicKey.toString(),
			amount: Number(task.reward),
			paymentAccount: "dfdfdkfj",
			nonce: BigInt(nonce),
		});

		return payment;
	}

	async storePayment(payment: Payment): Promise<void> {
		await this.store.put(payment);
	}

	async sendPayment(peerId: string, payment: Payment): Promise<void> {
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
				`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(Payment);
			await pb.write(payment);

			this.safeDispatchEvent("payment:sent", { detail: payment });
		} catch (e) {
			console.error("Error sending task", e);
		}
	}

	stop(): void | Promise<void> {
		// throw new Error("Method not implemented.");
	}
}

export function paymentProtocol(): (
	components: PaymentProtocolComponents,
) => PaymentProtocolService {
	return (components: PaymentProtocolComponents) =>
		new PaymentProtocolService(components);
}
