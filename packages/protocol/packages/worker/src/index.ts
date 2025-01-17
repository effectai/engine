import {
	filters,
	createLibp2p,
	yamux,
	webSockets,
	webRTC,
	noise,
	circuitRelayTransport,
	identify,
	gossipsub,
	pubSubPeerDiscovery,
	bootstrap,
	PeerType,
	kadDHT,
	pubsubPeerDiscovery
} from "@effectai/task-core";

import { workerService } from "./service/workerService";

export const createWorkerNode = async (bootstrapNodes: string[] = []) => {
	const node = await createLibp2p({
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		connectionGater: {
			denyDialMultiaddr: async () => false,
		},
		peerDiscovery: [
			// pubSubPeerDiscovery({
			// 	type: PeerType.Worker,
			// 	topics: ["manager-worker-discovery"],
			// }),
			pubsubPeerDiscovery({}),
			bootstrap({
				list: bootstrapNodes,
			}),
		],
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
			circuitRelayTransport({}),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			worker: workerService(),
			identify: identify({}),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
		},
	});


	return node
};
