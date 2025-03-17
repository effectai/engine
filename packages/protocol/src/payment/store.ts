import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { SignedPayment } from "./payment.js";

export interface PaymentStoreComponents {
	datastore: Datastore;
	logger: ComponentLogger;
	events: TypedEventTarget<Libp2pEvents>;
}

export interface PaymentStoreEvents {
	"task:stored": CustomEvent<SignedPayment>;
}

export class PaymentStore extends TypedEventEmitter<PaymentStoreEvents> {
	private readonly components: PaymentStoreComponents;
	private readonly datastore: Datastore;

	constructor(components: PaymentStoreComponents) {
		super();
		this.components = components;
		this.datastore = this.components.datastore;
	}

	async get(
		peerId: string,
		paymentId: string,
	): Promise<SignedPayment | undefined> {
		return SignedPayment.decode(
			await this.datastore.get(new Key(`/payments/${peerId}/${paymentId}`)),
		);
	}

	async put(peerId: string, payment: SignedPayment): Promise<SignedPayment> {
		await this.datastore.put(
			new Key(`/payments/${peerId}/${payment.nonce}`),
			SignedPayment.encode(payment),
		);
		return payment;
	}

	async all(): Promise<SignedPayment[]> {
		const tasks = [];
		for await (const entry of this.datastore.query({ prefix: "/payments/" })) {
			tasks.push(SignedPayment.decode(entry.value));
		}
		return tasks;
	}
}

export function paymentStore(): (
	components: PaymentStoreComponents,
) => PaymentStore {
	return (components: PaymentStoreComponents) => new PaymentStore(components);
}
