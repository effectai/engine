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
		nodeInfo: {
			version: "1.0.0",
			name: "relay",
		},
		transports: [webSockets({ filter: filters.all })],
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/15006/ws"],
		},
		connectionManager: {
		},
		connectionEncrypters: [noise()],
		peerDiscovery: [workerPubSubPeerDiscovery({ type: "relay" })],
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

	relay.addEventListener("peer:discovery", ({ detail }) => {
		console.log("Relay Discovered:", detail);
	})

	// report amount of reservations every 10 seconds
	setInterval(() => {
		console.log("Relay reservations:", relay.services.relay.reservations.size);
	}, 10000);

	console.log("Relay server listening on:", relay.getMultiaddrs());

	return relay;
};
