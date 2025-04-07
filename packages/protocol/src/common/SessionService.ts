// services/handshake.service.ts

import {
	type Connection,
	Libp2pEvents,
	type PeerId,
	PeerStore,
	type Startable,
	type Stream,
	TypedEventEmitter,
	TypedEventTarget,
} from "@libp2p/interface";
import type { Registrar } from "@libp2p/interface-internal";
import { handshake } from "it-handshake";
import { pipe } from "it-pipe";
import * as uint8arrays from "uint8arrays";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";

export interface SessionComponents {
	peerId: PeerId;
	registrar: Registrar;
	events: TypedEventTarget<Libp2pEvents>;
	peerStore: PeerStore;
}

export interface SessionEvents {
	"session:established": SessionInfo;
}

export type SessionData = {
	[key: string]: any;
};

export type SessionInit = {
	getData: () => SessionData;
};

export class SessionService
	extends TypedEventEmitter<SessionEvents>
	implements Startable
{
	private readonly protocol = "/effect-session/1.0.0";

	constructor(
		private components: SessionComponents,
		private sessionInit: SessionData,
	) {
		super();
		this.register();
	}

	async register() {
		this.components.registrar.handle(
			this.protocol,
			({ connection, stream }) => {
				this.peformHandshakeResponder(connection, stream).catch((err) => {
					console.error("Error in handshake responder:", err);
				});
			},
		);
	}

	async start() {
		console.log("SessionService started");
	}

	async stop() {}

	private async peformHandshakeResponder(
		connection: Connection,
		stream: Stream,
	) {
		try {
			// read stream data
			let peerSessionData: string | null = null;
			await pipe(stream, async (source) => {
				for await (const msg of source) {
					peerSessionData = uint8ArrayToString(msg.subarray());
				}
			});

			//respond with our own data..
			await pipe(
				[uint8arrays.fromString(JSON.stringify(this.getSessionData()))],
				stream.sink,
			);

			this.safeDispatchEvent("session:established", {
				detail: JSON.parse(peerSessionData || "{}"),
			});
		} catch (e) {
			console.error("Error in handshake responder:", e);
		}
	}

	public async peformHandshakeInitiator(connection: Connection) {
		const stream = await connection.newStream("/effect-session/1.0.0", {
			runOnLimitedConnection: false,
		});

		try {
			const ourData = this.getSessionData();

			await pipe(
				[uint8arrays.fromString(JSON.stringify(ourData))],
				stream.sink,
			);

			let peerSessionData: string | null = null;

			await pipe(stream.source, async (source) => {
				for await (const data of source) {
					peerSessionData = uint8ArrayToString(data.subarray());
				}
			});

			if (!peerSessionData) {
				throw new Error("Session data is null");
			}

			this.components.peerStore.merge(connection.remotePeer, {
				metadata: Object.entries(JSON.parse(peerSessionData)).reduce(
					(acc, [key, value]) => {
						if (value == null) return acc;
						return {
							...acc,
							[`session:${key}`]: new TextEncoder().encode(
								typeof value === "object"
									? JSON.stringify(value)
									: String(value),
							),
						};
					},
					{},
				),
			});

			return JSON.parse(peerSessionData);
		} catch (e) {
			console.error("Error in handshake initiator:", e);
			throw e;
		}
	}

	private getSessionData(): SessionData {
		return this.sessionInit.getData();
	}
}

export function session(
	init: Partial<SessionInit> = {},
): (components: SessionComponents) => SessionService {
	return (components: SessionComponents) =>
		new SessionService(components, init);
}
