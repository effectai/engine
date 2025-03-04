import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { getActiveOutBoundConnections } from "../../utils.js";
import { Payment } from "./pb/payment.js";
import { Task } from "../task/index.js";
import { publicKeyFromRaw } from "@libp2p/crypto/keys";

export interface PaymentProtocolEvents {}

export interface PaymentProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
}

export class PaymentProtocolService
	extends TypedEventEmitter<PaymentProtocolEvents>
	implements Startable
{
	private readonly components: PaymentProtocolComponents;

	constructor(components: PaymentProtocolComponents) {
		super();
		this.components = components;
	}

	async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(Payment);
		const task = await pb.read();
	}

	async start(): Promise<void> {
		this.components.registrar.handle(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			this.handleProtocol.bind(this),
			{ runOnLimitedConnection: false },
		);
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
		const nonce = 1;

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
