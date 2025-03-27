import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import type { Ed25519PrivateKey } from "@libp2p/interface";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import { type Datastore, Key } from "interface-datastore";
import { createLibp2p } from "libp2p";
import { workerProtocol, WorkerSession } from "./worker.js";
import { webTransport } from "@libp2p/webtransport";

export type WorkerNode = ReturnType<typeof createWorkerNode>;

export const createWorkerNode = (
	peers: string[],
	privateKey?: Ed25519PrivateKey,
	datastore?: Datastore,
	onRequestSessionData?: () => Promise<WorkerSession>,
) => {
	return createLibp2p({
		start: false,
		...(datastore && { datastore }),
		...(privateKey && { privateKey }),
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		connectionGater: {
			// Allow private addresses for local testing
			denyDialMultiaddr: async () => false,
		},
		transports: [
			webSockets(),
			webRTC(),
			webTransport(),
			circuitRelayTransport(),
		],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [
			...(peers && peers.length > 0 ? [bootstrap({ list: peers })] : []),
		],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			worker: workerProtocol({ onRequestSessionData }),
		},
	});
};
