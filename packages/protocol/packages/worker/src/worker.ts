import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify } from "@libp2p/identify";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
import * as filters from "@libp2p/websockets/filters";
import type { Ed25519PrivateKey } from "@libp2p/interface";
import {
	taskProtocol,
	taskStore,
	announcePeerDiscovery,
} from "@effectai/protocol-core";
import { workerService } from "./service.js";

export const createWorkerNode = (
	peers: string[],
	privateKey?: Ed25519PrivateKey,
) => {
	return createLibp2p({
		...(privateKey && { privateKey }),
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
			circuitRelayTransport(),
		],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [
			...(peers && peers.length > 0 ? [bootstrap({ list: peers })] : []),
			announcePeerDiscovery(),
		],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			taskStore: taskStore(),
			task: taskProtocol(),
			worker: workerService(),
		},
	});
};
