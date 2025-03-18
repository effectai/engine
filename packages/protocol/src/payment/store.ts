import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { Payment } from "./payment.js";

export interface PaymentStoreComponents {
	datastore: Datastore;
	logger: ComponentLogger;
	events: TypedEventTarget<Libp2pEvents>;
}

export interface PaymentStoreEvents {
	"task:stored": CustomEvent<Payment>;
}

export class PaymentStore extends TypedEventEmitter<PaymentStoreEvents> {
	private readonly components: PaymentStoreComponents;
	private readonly datastore: Datastore;

	constructor(components: PaymentStoreComponents) {
		super();
		this.components = components;
		this.datastore = this.components.datastore;
	}

	async get(peerId: string, paymentId: string): Promise<Payment | undefined> {
		return Payment.decode(
			await this.datastore.get(new Key(`/payments/${peerId}/${paymentId}`)),
		);
	}

	async put(peerId: string, payment: Payment): Promise<Payment> {
		await this.datastore.put(
			new Key(`/payments/${peerId}/${payment.nonce}`),
			Payment.encode(payment),
		);
		return payment;
	}

	async all(): Promise<Payment[]> {
		const tasks = [];
		for await (const entry of this.datastore.query({ prefix: "/payments/" })) {
			tasks.push(Payment.decode(entry.value));
		}
		return tasks;
	}
}

export function paymentStore(): (
	components: PaymentStoreComponents,
) => PaymentStore {
	return (components: PaymentStoreComponents) => new PaymentStore(components);
}
