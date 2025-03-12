import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { Challenge } from "./pb/challenge.js";

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

	async get(taskId: string): Promise<Challenge | undefined> {
		return Challenge.decode(
			await this.datastore.get(new Key(`/challenges/${taskId}`)),
		);
	}

	async put(task: Challenge): Promise<Challenge> {
		await this.datastore.put(
			new Key(`/challenges/${task.id}`),
			Challenge.encode(task),
		);
		return task;
	}

	async all(): Promise<Challenge[]> {
		const tasks = [];
		for await (const entry of this.datastore.query({
			prefix: "/challenges/",
		})) {
			tasks.push(Challenge.decode(entry.value));
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
