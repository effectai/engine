import {
	createLibp2p,
	webSockets,
	identify,
	circuitRelayServer,
	yamux,
	noise,
	filters,
	pubSubPeerDiscovery,
	Libp2p,
} from "@effectai/task-core";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { PeerType } from "../../core/dist/discovery/pubsub/peer.js";

export const createBootstrapRelayerServer = async () => {
	const relay = await createLibp2p({
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
			pubSubPeerDiscovery({
				type: PeerType.Relay,
				topics: ["provider-manager-discovery", "manager-worker-discovery"],
			}),
		],
		streamMuxers: [yamux()],
		services: {
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

	await relay.start();

	// report amount of reservations every 10 seconds
	setInterval(() => {
		console.log("Relay reservations:", relay.services.relay.reservations.size);
	}, 10000);

	console.log("Relay server listening on:", relay.getMultiaddrs());

	return relay;
};
