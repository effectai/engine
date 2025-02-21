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
import { peerIdFromString } from "@libp2p/peer-id";
import { getActiveOutBoundConnections } from "../../utils.js";
import { Challenge } from "./pb/challenge.js";

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

		console.log("Challenge received", challenge);
	}

	async sendChallenge(challenge: Challenge): Promise<void> {
		//fetch connected workers that are due for a challenge.
		const workers = "";

		//generate a challenge (simple math question will do for now)

		//send challenge to worker
	}
}

export function taskProtocol(): (
	components: ChallengeProtolComponents,
) => ChallengeProtocol {
	return (components: ChallengeProtolComponents) =>
		new ChallengeProtocol(components);
}
