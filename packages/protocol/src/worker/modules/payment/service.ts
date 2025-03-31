import {
	Libp2pEvents,
	TypedEventEmitter,
	TypedEventTarget,
	type PeerStore,
	type PrivateKey,
} from "@libp2p/interface";
import { Payment } from "../../../common/proto/effect.js";
import { ProtoStore } from "../../../common/proto-store.js";
import type { Datastore } from "interface-datastore";
import { logger } from "../../../common/logging.js";
import { WorkerProtocolEvents } from "../../worker.js";

export interface ManagerPaymentServiceComponents {
	peerStore: PeerStore;
	privateKey: PrivateKey;
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
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

	public async onReceivePayment({
		payment,
	}: {
		payment: Payment;
	}): Promise<void> {
		logger.info("WORKER: Received payment", payment);
		await this.store.put(payment.nonce.toString(), payment);
		this.components.events.safeDispatchEvent("payment:received", {
			detail: payment,
		});
	}

	public async getPayments(): Promise<Payment[]> {
		return await this.store.all();
	}
}
