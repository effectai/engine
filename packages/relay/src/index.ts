import {
	createLibp2p,
	webSockets,
	identify,
	circuitRelayServer,
	yamux,
	noise,
	filters,
	workerPubSubPeerDiscovery,
	Libp2p,
} from "@effectai/task-core";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";

export const createBootstrapRelayerServer = async () => {
	const relay = await createLibp2p({
		transports: [webSockets({ filter: filters.all })],
		addresses: {
			listen: ["/ip4/127.0.0.1/tcp/15003/ws"],
		},
		nodeInfo: {
			version: "1.0.0",
			name: "relay",
		},
		connectionEncrypters: [noise()],
		peerDiscovery: [workerPubSubPeerDiscovery({ type: "relay" })],
		streamMuxers: [yamux()],
		services: {
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
			identify: identify(),
			relay: circuitRelayServer(),
		},
	});

	await relay.start();

	console.log("Relay server listening on:", relay.getMultiaddrs());

	return relay;
};
