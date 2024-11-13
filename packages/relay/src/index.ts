import {
	createLibp2p,
	webSockets,
	identify,
	circuitRelayServer,
	yamux,
	noise,
	filters,
	pubSubPeerDiscovery,
	pubsubPeerDiscovery,
	Libp2p,
	PeerType,
	kadDHT
} from "@effectai/task-core";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";

export const createBootstrapRelayerServer = async () => {
	const node = await createLibp2p({
		nodeInfo: {
			version: "1.0.0",
			name: "relay",
		},
		transports: [webSockets({ filter: filters.all })],
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/15006/ws"],
		},
		connectionEncrypters: [noise()],
		peerDiscovery: [
			pubsubPeerDiscovery({
				
			})
			// pubSubPeerDiscovery({
			// 	type: PeerType.Relay,
			// 	topics: ["provider-manager-discovery", "manager-worker-discovery"],
			// }),
		],
		streamMuxers: [yamux()],
		services: {
			kadDHT: kadDHT({
				clientMode: false,
				protocol: "ipfs/kad/1.0.0",
			}),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
			identify: identify(),
			relay: circuitRelayServer({
				reservations: {
					maxReservations: 32,
					reservationClearInterval: 30000,
				},
			}),
		},
	});

	await node.start();

	// report amount of reservations every 10 seconds
	setInterval(() => {
		console.log("Relay reservations:", node.services.relay.reservations.size);
	}, 10000);

	console.log("Relay server listening on:", node.getMultiaddrs());

	return node;
};
