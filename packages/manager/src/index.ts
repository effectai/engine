import {
	createLibp2p,
	webSockets,
	webRTC,
	circuitRelayTransport,
	noise,
	yamux,
	identify,
	filters,
	pubSubPeerDiscovery,
	bootstrap,
	gossipsub,
	distributedNodeQueueService,
	PeerType,
	peerIdFromString,
	Buffer,
	type PeerId,
	kadDHT,
	pubsubPeerDiscovery
} from "@effectai/task-core";
import { managerService } from "./service/managerService.js";

export const createManagerNode = async (bootstrapNodes: string[] = []) => {
	const node = await createLibp2p({
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		connectionGater: {
			denyDialMultiaddr: async () => false,
		},
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
			circuitRelayTransport({}),
		],
		peerDiscovery: [
			// pubSubPeerDiscovery({
			// 	type: PeerType.Manager,
			// 	topics: ["manager-worker-discovery", "provider-manager-discovery"],
			// }),
			pubsubPeerDiscovery({
				
			}),
			bootstrap({
				list: bootstrapNodes,
			}),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			kadDHT: kadDHT({
				clientMode: false,
				protocol: "ipfs/kad/1.0.0",
			}),
			manager: managerService(),
			identify: identify(),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
		},
	});

	node.addEventListener("peer:discovery", ({ detail }) => {
		console.log("Discovered peer", detail);
	});

	return node;
};
