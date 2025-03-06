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

import { Challenge } from "./pb/challenge.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { getActiveOutBoundConnections } from "../../utils.js";
import { ChallengeStore, challengeStore } from "./store.js";
import type { Datastore } from "interface-datastore";

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

export class ChallengeProtocolService
	extends TypedEventEmitter<ChallengeProtocolEvents>
	implements Startable
{
	private readonly components: ChallengeProtocolComponents;
	private readonly store: ChallengeStore;

	constructor(components: ChallengeProtocolComponents) {
		super();
		this.components = components;
		this.store = new ChallengeStore(this.components);
	}

	async start(): Promise<void> {
		this.components.registrar.handle(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			this.handleChallenge.bind(this),
			{ runOnLimitedConnection: false },
		);
	}

	stop(): void | Promise<void> {
		//TODO:: save store to disk ?
	}

	async handleChallenge(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(Challenge);
		const challenge = await pb.read();

		//save challenge in the store.
		this.safeDispatchEvent("challenge:received", { detail: challenge });
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
	}
}

export function challengeProtocol(): (
	components: ChallengeProtocolComponents,
) => ChallengeProtocolService {
	return (components: ChallengeProtocolComponents) =>
		new ChallengeProtocolService(components);
}
