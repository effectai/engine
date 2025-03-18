import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
	type ComponentLogger,
	type Libp2pEvents,
	type TypedEventTarget,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { PaymentMessage, Payment } from "./payment.js";
import { PaymentStore } from "./store.js";
import type { Datastore } from "interface-datastore";

import type { PublicKey } from "@solana/web3.js";
import {
	bigIntToUint32Array,
	bigIntToUint8Array,
	LibP2pPublicKeyToSolanaPublicKey,
} from "../utils/utils.js";
import { signPayment } from "./utils.js";

export type PaymentProtocolEvents = {
	"payment:sent": CustomEvent<Payment>;
	"payment:received": CustomEvent<Payment>;
	"payment:nonce-request": CustomEvent<string>;
	"payment:nonce-response": CustomEvent<number>;
	"payment:acknowledged": CustomEvent<Payment>;
};

export interface PaymentProtocolComponents {
	privateKey: PrivateKey;
	registrar: Registrar;
	connectionManager: ConnectionManager;
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export class PaymentProtocolService extends TypedEventEmitter<PaymentProtocolEvents> {
	private readonly components: PaymentProtocolComponents;
	private readonly store: PaymentStore;

	constructor(components: PaymentProtocolComponents) {
		super();
		this.components = components;
		this.store = new PaymentStore(this.components);
	}

	async getPayments(): Promise<Payment[]> {
		return await this.store.all();
	}

	async storePayment(managerPeer: string, payment: Payment): Promise<void> {
		await this.store.put(managerPeer, payment);
	}

	async generatePayment(
		peerId: string,
		amount: number,
		nonce: bigint,
		paymentAccount: PublicKey,
	): Promise<Payment> {
		try {
			const pid = peerIdFromString(peerId);

			if (!pid.publicKey || pid.publicKey.type !== "Ed25519") {
				throw new Error("PeerId does not have a public key");
			}

			const recipient = LibP2pPublicKeyToSolanaPublicKey(
				pid.publicKey,
			).toBase58();

			const payment = Payment.decode(
				Payment.encode({
					amount,
					recipient,
					paymentAccount: paymentAccount.toBase58(),
					nonce,
				}),
			);

			const signature = await signPayment(payment, this.components.privateKey);

			payment.signature = {
				S: signature.S.toString(),
				R8: {
					R8_1: new Uint8Array(signature.R8[0]),
					R8_2: new Uint8Array(signature.R8[1]),
				},
			};

			//store payment after we generate it.
			await this.storePayment(peerId, payment);

			return payment;
		} catch (e) {
			//TODO:: handle error
			console.error("Error generating payment", e);
			throw e;
		}
	}
}

export function paymentProtocol(): (
	components: PaymentProtocolComponents,
) => PaymentProtocolService {
	return (components: PaymentProtocolComponents) =>
		new PaymentProtocolService(components);
}
