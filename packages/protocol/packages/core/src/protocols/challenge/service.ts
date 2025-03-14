import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
	type ComponentLogger,
	type Libp2pEvents,
	type TypedEventTarget,
	type PeerId,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";

import { Challenge } from "./pb/challenge.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { getActiveOutBoundConnections } from "../../utils.js";
import { ChallengeStore, challengeStore } from "./store.js";
import type { Datastore } from "interface-datastore";
import { Task, TaskStatus } from "../task/index.js";
import { randomUUID } from "node:crypto";

export interface ChallengeProtocolEvents {
	"challenge:received": CustomEvent<Challenge>;
	"challenge:sent": CustomEvent<Challenge>;
}

export interface ChallengeProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	datastore: Datastore;
	logger: ComponentLogger;
	events: TypedEventTarget<Libp2pEvents>;
}

export class ChallengeProtocolService extends TypedEventEmitter<ChallengeProtocolEvents> {
	private readonly components: ChallengeProtocolComponents;
	private readonly store: ChallengeStore;

	constructor(components: ChallengeProtocolComponents) {
		super();
		this.components = components;
		this.store = new ChallengeStore(this.components);
		this.start();
	}

	async start(): Promise<void> {
		this.components.registrar.handle(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			this.handleChallenge.bind(this),
			{ runOnLimitedConnection: false },
		);
	}

	async handleChallenge(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(Challenge);
		const challenge = await pb.read();
		this.safeDispatchEvent("challenge:received", { detail: challenge });
	}

	async storeChallenge(peerId: PeerId, challenge: Challenge): Promise<void> {
		await this.store.put(peerId, challenge);
	}

	async getChallenges(peerId?: PeerId): Promise<Challenge[]> {
		return this.store.all(peerId);
	}

	async getChallenge(
		peerId: PeerId,
		challengeId: string,
	): Promise<Challenge | undefined> {
		return this.store.get(peerId, challengeId);
	}

	async sendChallenge(peerId: string, challenge: Challenge): Promise<void> {
		const peer = peerIdFromString(peerId);

		let [connection] = await getActiveOutBoundConnections(
			this.components.connectionManager,
			peer,
		);

		if (!connection) {
			connection = await this.components.connectionManager.openConnection(peer);
		}

		const stream = await connection.newStream(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
		);

		const pb = pbStream(stream).pb(Challenge);
		await pb.write(challenge);

		await this.storeChallenge(peer, challenge);
		this.safeDispatchEvent("challenge:sent", { detail: challenge });
	}

	createChallenge(): Uint8Array {
		return Challenge.encode({
			id: randomUUID(),
			createdAt: new Date().toISOString(),
			answer: "7",
			task: {
				id: "1234",
				created: new Date().toISOString(),
				manager: "",
				reward: "500",
				template: "what is 3 + 4?",
				result: "",
				signature: "",
				status: TaskStatus.CREATED,
			},
		});
	}
}

export function challengeProtocol(): (
	components: ChallengeProtocolComponents,
) => ChallengeProtocolService {
	return (components: ChallengeProtocolComponents) =>
		new ChallengeProtocolService(components);
}
