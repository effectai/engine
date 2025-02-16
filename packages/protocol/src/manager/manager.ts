import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
import { announcePeerDiscovery } from "../core/src/service/pubsub/announce.js";
import { bootstrap } from "@libp2p/bootstrap";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import {
	taskStore,
	managerService,
	createPeerQueue,
} from "../core/src/index.js";
import { taskProtocol } from "../core/src/protocols/task/task.js";
import * as filters from "@libp2p/websockets/filters";

export const createManagerNode = (peers: string[]) => {
	return createLibp2p({
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/0/ws"],
		},
		transports: [webSockets()],
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
			manager: managerService(),
			peerQueue: createPeerQueue(),
			relay: circuitRelayServer(),
		},
	});
};

//
// export const createManagerNode = (peers: string[]) => {
// 	return createLibp2p({
// 		addresses: {
// 			listen: ["/ip4/0.0.0.0/tcp/0/ws"],
// 		},
// 		transports: [webSockets({ filter: filters.all })],
// 		streamMuxers: [yamux()],
// 		connectionEncrypters: [noise()],
// 		peerDiscovery: [
// 			...(peers && peers.length > 0 ? [bootstrap({ list: peers })] : []),
// 			announcePeerDiscovery(),
// 		],
// 		services: {
// 			pubsub: gossipsub(),
// 			identify: identify(),
// 			taskStore: taskStore(),
// 			task: taskProtocol(),
// 			manager: managerService(),
// 			peerQueue: createPeerQueue(),
// 			relay: circuitRelayServer(),
// 		},
// 	});
// };
