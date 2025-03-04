import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
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

export interface ChallengeProtocolEvents {
	"challenge:received": CustomEvent<Challenge>;
	"challenge:sent": CustomEvent<Challenge>;
}

export interface ChallengeProtolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
}

export class ChallengeProtocol
	extends TypedEventEmitter<ChallengeProtocolEvents>
	implements Startable
{
	private readonly components: ChallengeProtolComponents;

	constructor(components: ChallengeProtolComponents) {
		super();
		this.components = components;
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
	components: ChallengeProtolComponents,
) => ChallengeProtocol {
	return (components: ChallengeProtolComponents) =>
		new ChallengeProtocol(components);
}
