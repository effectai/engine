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

	async has(peerId: PeerId, challengeId: string): Promise<boolean> {
		return this.datastore.has(new Key(`/challenges/${peerId}/${challengeId}`));
	}

	async get(
		peerId: PeerId,
		challengeId: string,
	): Promise<Challenge | undefined> {
		return Challenge.decode(
			await this.datastore.get(new Key(`/challenges/${peerId}/${challengeId}`)),
		);
	}

	async put(peerId: PeerId, challenge: Challenge): Promise<Challenge> {
		await this.datastore.put(
			new Key(`/challenges/${peerId.toString()}/${challenge.id}`),
			Challenge.encode(challenge),
		);
		return challenge;
	}

	async all(peerId?: PeerId): Promise<Challenge[]> {
		const tasks = [];

		const filters = peerId
			? [
					(entry: { key: { toString: () => string } }) =>
						entry.key.toString().includes(peerId.toString()),
				]
			: [];

		for await (const entry of this.datastore.query({
			prefix: "/challenges/",
			filters,
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
