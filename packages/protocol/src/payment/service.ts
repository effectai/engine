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
import { PaymentMessage, SignedPayment } from "./payment.js";
import { PaymentStore } from "./store.js";
import type { Datastore } from "interface-datastore";

import type { PublicKey } from "@solana/web3.js";
import { LibP2pPublicKeyToSolanaPublicKey } from "../utils/utils.js";

export type PaymentProtocolEvents = {
	"payment:sent": CustomEvent<SignedPayment>;
	"payment:received": CustomEvent<SignedPayment>;
	"payment:nonce-request": CustomEvent<string>;
	"payment:nonce-response": CustomEvent<number>;
	"payment:acknowledged": CustomEvent<SignedPayment>;
};

export interface PaymentProtocolComponents {
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
		this._initialize();
	}

	async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(PaymentMessage);
		const message = await pb.read();

		if (message.requestNonce) {
			const manager = message.requestNonce.peerId;
			this.safeDispatchEvent("payment:nonce-request", { detail: manager });
		} else if (message.signedPayment) {
			// const payment = SignedPayment.decode(message.signedPayment);
			// this.safeDispatchEvent("payment:received", { detail: payment });
		} else if (message.nonceResponse) {
			const nonce = message.nonceResponse.nonce;
			this.safeDispatchEvent("payment:nonce-response", { detail: nonce });
		} else if (message.paymentAck) {
			//TODO:: handle paymentAck
		}
	}

	async _initialize(): Promise<void> {
		//retrieve the nonce from the worker on peer discovery
		this.components.events.addEventListener("peer:identify", async (event) => {
			//check if this peer has the payment protocol
			// console.log(event.detail.protocols);
		});
	}

	async getPayments(): Promise<SignedPayment[]> {
		return await this.store.all();
	}

	async storePayment(
		managerPeer: string,
		payment: SignedPayment,
	): Promise<void> {
		await this.store.put(managerPeer, payment);
	}

	async generatePayment(
		peerId: string,
		amount: number,
		nonce: number,
		paymentAccount: PublicKey,
	): Promise<SignedPayment> {
		try {
			const pid = peerIdFromString(peerId);

			if (!pid.publicKey || pid.publicKey.type !== "Ed25519") {
				throw new Error("PeerId does not have a public key");
			}

			const recipient = LibP2pPublicKeyToSolanaPublicKey(
				pid.publicKey,
			).toBase58();

			const payment = SignedPayment.encode({
				amount,
				recipient,
				paymentAccount: paymentAccount.toBase58(),
				nonce: BigInt(nonce),
			});

			//TODO:: sign the payment here..
			// payment.signature = await

			//store payment after we generate it.
			await this.storePayment(peerId, payment);

			return payment;
		} catch (e) {
			//TODO:: handle error
			console.error("Error generating payment", e);
			throw e;
		}
	}

	async sendPaymentMessage(
		peerId: string,
		paymentMessage: PaymentMessage,
	): Promise<void> {
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

			const pb = pbStream(stream).pb(PaymentMessage);
			await pb.write(paymentMessage);
		} catch (e) {
			console.error("Error sending payment", e);
		}
	}
}

export function paymentProtocol(): (
	components: PaymentProtocolComponents,
) => PaymentProtocolService {
	return (components: PaymentProtocolComponents) =>
		new PaymentProtocolService(components);
}
