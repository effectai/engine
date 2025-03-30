import type { IdentifyResult, PeerId, PrivateKey } from "@libp2p/interface";
import { buildEddsa } from "circomlibjs";
import { pbStream } from "it-protobuf-stream";
import {
	getOrCreateActiveOutBoundStream,
	bigIntToUint8Array,
	uint8ArrayToBigInt,
} from "../../../utils/utils.js";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "../../../worker/consts.js";
import { PublicKey } from "@solana/web3.js";

import type { ConnectionManager } from "@libp2p/interface-internal";
import type { PeerStore } from "@libp2p/interface";
import type { WorkerQueue } from "../../queue.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { EffectProtocolMessage } from "../../../proto/effect.js";
import { WorkerSession } from "../../../worker/worker.js";

export interface ManagerSessionComponents {
	connectionManager: ConnectionManager;
	peerStore: PeerStore;
	privateKey: PrivateKey;
}

export type WorkerSessionData = {
	nonce: bigint;
	recipient: PublicKey;
	lastPayoutTimestamp: number;
};

export class ManagerSessionService {
	constructor(private components: ManagerSessionComponents) {}

	public async sendMessage(peerId: string, message: EffectProtocolMessage) {
		try {
			// console.log("Sending message to worker", peerId, message);
			const stream = await getOrCreateActiveOutBoundStream(
				peerId,
				this.components.connectionManager,
				`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(EffectProtocolMessage);
			await pb.write(message);

			await stream.close();

			return {
				peer: peerId,
				message,
			};
		} catch (e) {
			console.error("Error sending message to worker", e);
		}
	}

	getMeta = async (peerId: PeerId): Promise<WorkerSessionData> => {
		const peerData = await this.components.peerStore.get(peerId);

		const nonce = peerData.metadata.get("nonce");
		const recipient = peerData.metadata.get("recipient");

		if (!recipient) {
			throw new Error(`No recipient found for peerId: ${peerId}`);
		}

		const lastPayoutTimestamp = peerData.metadata.get("timeSinceLastPayout");
		if (!lastPayoutTimestamp) {
			throw new Error(`No lastPayoutTimestamp found for peerId: ${peerId}`);
		}

		return {
			nonce: nonce ? uint8ArrayToBigInt(new Uint8Array(nonce)) : BigInt(0),
			recipient: new PublicKey(recipient),
			lastPayoutTimestamp: Number.parseInt(
				new TextDecoder().decode(lastPayoutTimestamp),
			),
		};
	};

	async setNonce(peerId: PeerId, nonce: bigint): Promise<void> {
		await this.components.peerStore.merge(peerId, {
			metadata: {
				nonce: bigIntToUint8Array(nonce),
			},
		});
	}

	async setDelegate(peerId: PeerId, delegate: PublicKey): Promise<void> {
		await this.components.peerStore.merge(peerId, {
			metadata: {
				delegate: delegate.toBuffer(),
			},
		});
	}

	async setLastPayoutTimestamp(
		peerId: PeerId,
		timestamp: string,
	): Promise<void> {
		await this.components.peerStore.merge(peerId, {
			metadata: {
				lastPayoutTimestamp: new TextEncoder().encode(timestamp),
			},
		});
	}

	async getLastPayoutTimestamp(peerId: PeerId): Promise<number> {
		const peerData = await this.components.peerStore.get(peerId);

		if (!peerData) {
			throw new Error(`No peer data found for peerId: ${peerId}`);
		}

		return Number.parseInt(
			new TextDecoder().decode(peerData.metadata.get("lastPayoutTimestamp")),
		);
	}

	async pairWorker(result: CustomEvent<IdentifyResult>["detail"]) {
		try {
			const eddsa = await buildEddsa();
			const key = eddsa.prv2pub(this.components.privateKey.raw.slice(0, 32));

			const message: EffectProtocolMessage = {
				managerSession: {
					pubX: key[0],
					pubY: key[1],
				},
			};

			const stream = await getOrCreateActiveOutBoundStream(
				result.peerId.toString(),
				this.components.connectionManager,
				`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(EffectProtocolMessage);
			await pb.write(message);
			const response = await pb.read();

			//close stream
			await stream.close();

			const timestamp = Math.floor(new Date().getTime() / 1000);
			const buffer = Buffer.alloc(4);
			buffer.writeUInt32BE(timestamp, 0);

			if (!response.workerSession?.nonce) {
				console.error("No nonce found for worker, skipping pairing..");
				return;
			}

			this.components.peerStore.merge(result.peerId, {
				metadata: {
					timeSinceLastPayout: buffer,
					nonce: bigIntToUint8Array(response.workerSession.nonce),
					recipient: response.workerSession.recipient,
				},
			});
		} catch (e) {
			console.error("Error pairing worker", e);
		}
	}

	async retrieveWorkerMeta(peerId: string): Promise<WorkerSession> {
		try {
			const peer = peerIdFromString(peerId);
			const peerData = await this.components.peerStore.get(peer);

			if (!peerData) {
				throw new Error(`No peer data found for peerId: ${peerId}`);
			}

			const nonce = peerData.metadata.get("nonce");
			if (!nonce) {
				throw new Error(`No nonce found for worker with peerId: ${peerId}`);
			}

			const recipient = peerData.metadata.get("recipient");
			if (!recipient) {
				throw new Error(`No delegate found for worker with peerId: ${peerId}`);
			}

			return {
				nonce: uint8ArrayToBigInt(new Uint8Array(nonce)),
				recipient: new PublicKey(recipient),
			};
		} catch (error) {
			console.error("Error retrieving worker meta", error);
			throw error;
		}
	}
}
