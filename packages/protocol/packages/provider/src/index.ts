import {
	circuitRelayTransport,
	pubSubPeerDiscovery,
	createLibp2p,
	filters,
	gossipsub,
	identify,
	noise,
	webRTC,
	webSockets,
	yamux,
	bootstrap,
	type Libp2p,
	type Batch,
	type Multiaddr,
	PeerType,
} from "@effectai/task-core";
import { providerService } from "./services/providerService.js";

export const createProviderNode = async (bootstrapNodes: string[] = []) => {
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
			circuitRelayTransport(),
		],
		peerDiscovery: [
			pubSubPeerDiscovery({
				type: PeerType.Provider,
				topics: ["provider-manager-discovery"],
			}),
			bootstrap({
				list: bootstrapNodes,
			}),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			provider: providerService(),
			identify: identify(),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
		},
	});

	return node;
};
