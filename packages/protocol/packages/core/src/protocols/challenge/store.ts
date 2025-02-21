import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { Payment } from "../../protocols/payment/pb/payment.js";

export interface ChallengeStoreComponents {
	datastore: Datastore;
	logger: ComponentLogger;
	events: TypedEventTarget<Libp2pEvents>;
}

export class ChallengeStore {
	private readonly components: ChallengeStoreComponents;
	private readonly datastore: Datastore;

	constructor(components: ChallengeStoreComponents) {
		this.components = components;
		this.datastore = this.components.datastore;
	}

	async has(taskId: string): Promise<boolean> {
		return this.datastore.has(new Key(`/challenges/${taskId}`));
	}

	async get(taskId: string): Promise<Payment | undefined> {
		return Payment.decode(
			await this.datastore.get(new Key(`/challenges/${taskId}`)),
		);
	}

	async put(task: Payment): Promise<Payment> {
		await this.datastore.put(
			new Key(`/challenges/${task.id}`),
			Payment.encode(task),
		);
		return task;
	}

	async all(): Promise<Payment[]> {
		const tasks = [];
		for await (const entry of this.datastore.query({
			prefix: "/challenges/",
		})) {
			tasks.push(Payment.decode(entry.value));
		}
		return tasks;
	}
}

export function challengeStore(): (
	components: ChallengeStoreComponents,
) => ChallengeStore {
	return (components: ChallengeStoreComponents) =>
		new ChallengeStore(components);
}
