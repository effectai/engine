import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import * as filters from "@libp2p/websockets/filters";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import type { PrivateKey } from "@libp2p/interface";
import {
	taskStore,
	taskProtocol,
	workerQueue,
	announcePeerDiscovery,
} from "@effectai/protocol-core";
import { managerService } from "./service.js";

export const createManagerNode = (peers: string[], privateKey?: PrivateKey) => {
	return createLibp2p({
		...(privateKey && { privateKey }),
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/34859/ws"],
		},
		transports: [webSockets({ filter: filters.all })],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [
			...(peers && peers.length > 0 ? [bootstrap({ list: peers })] : []),
			announcePeerDiscovery(),
		],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			workerQueue: workerQueue(),
			taskStore: taskStore(),
			task: taskProtocol(),
			manager: managerService(),
			relay: circuitRelayServer(),
		},
	});
};
