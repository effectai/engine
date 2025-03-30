import {
	TypedEventEmitter,
	type PeerStore,
	type PrivateKey,
} from "@libp2p/interface";
import { Payment } from "../../../proto/effect.js";
import { ProtoStore } from "../../../common/proto-store.js";
import type { Datastore } from "interface-datastore";
import { logger } from "../../../common/logging.js";

export interface ManagerPaymentServiceComponents {
	peerStore: PeerStore;
	privateKey: PrivateKey;
	datastore: Datastore;
}

export interface WorkerPaymentServiceEvents {
	"payment:received": CustomEvent<Payment>;
}

export class WorkerPaymentService extends TypedEventEmitter<WorkerPaymentServiceEvents> {
	private readonly store: ProtoStore<Payment>;

	constructor(private components: ManagerPaymentServiceComponents) {
		super();
		this.store = new ProtoStore<Payment>(this.components, {
			prefix: "payments",
			encoder: Payment.encode,
			decoder: Payment.decode,
		});
	}

	public async onReceivePayment(payment: Payment): Promise<void> {
		logger.info("WORKER: Received payment", payment);
		await this.store.put(payment.nonce.toString(), payment);
		this.safeDispatchEvent("payment:received", { detail: payment });
	}
}
