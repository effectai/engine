import type { IncomingStreamData, PeerId, Stream } from "@libp2p/interface";
import type { Libp2p } from "libp2p";
import { Uint8ArrayList } from "uint8arraylist";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { createLibp2p } from "libp2p";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { announcePeerDiscovery } from "./service/pubsub/announce.js";
import { taskProtocol } from "./protocols/task/task.js";
import { webSockets } from "@libp2p/websockets";
import { bootstrap } from "@libp2p/bootstrap";
import { taskStore } from "./service/store/task.js";
import { managerService } from "./service/manager/managerService.js";
import { createPeerQueue } from "./service/queue/peer.js";
import {
	circuitRelayServer,
	circuitRelayTransport,
} from "@libp2p/circuit-relay-v2";
import { workerService } from "./service/worker/workerService.js";
import * as filters from "@libp2p/websockets/filters";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";

export const getOpenOutboundConnections = (node: Libp2p, peerId?: PeerId) => {
	const connections = node.getConnections(peerId);
	return connections.filter((conn) => conn.status === "open");
};

export const getActiveOutBoundStreams = async (
	node: Libp2p,
	peerId?: PeerId,
) => {
	const connections = getOpenOutboundConnections(node, peerId);
	const streams = connections.map((conn) => conn.streams);
	console.log("streams:", streams);
	return streams.flat();
};

export const handleMessage = async (streamData: IncomingStreamData) => {
	const data = new Uint8ArrayList();

	for await (const chunk of streamData.stream.source) {
		data.append(chunk);
	}

	return JSON.parse(new TextDecoder().decode(data.subarray()));
};

export const createWorkerNode = (peers: string[]) => {
	return createLibp2p({
		addresses: {
			listen: ["/p2p-circuit"],
		},
		transports: [webSockets(), circuitRelayTransport()],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [announcePeerDiscovery(), bootstrap({ list: peers })],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			taskStore: taskStore(),
			task: taskProtocol(),
			worker: workerService(),
		},
	});
};
//
// export const createWorkerNode = (peers: string[]) => {
// 	return createLibp2p({
// 		addresses: {
// 			listen: ["/p2p-circuit", "/webrtc"],
// 		},
// 		transports: [
// 			webSockets({ filter: filters.all }),
// 			webRTC(),
// 			circuitRelayTransport(),
// 		],
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
// 			worker: workerService(),
// 		},
// 	});
// };
