import {
	circuitRelayServer,
	circuitRelayTransport,
	createLibp2p,
	filters,
	identify,
	kadDHT,
	multiaddr,
	bootstrap,
	noise,
	peerIdFromString,
	removePublicAddressesMapper,
	webRTC,
	webSockets,
	yamux,
} from "packages/core/dist";
import { expect, test, afterEach, beforeEach, it } from "vitest";

it(
	"tests a DHT",
	async () => {
		const bootstrapNode = await createLibp2p({
			addresses: {
				listen: ["/ip4/127.0.0.1/tcp/15005/ws"],
			},
			transports: [webSockets({})],
			connectionEncrypters: [noise()],
			streamMuxers: [yamux()],
			services: {
				kadDHT: kadDHT({
					clientMode: false,
					peerInfoMapper: (peer) => {
						console.log("hello!", peer)
						return peer
					},
				}),
			
				identify: identify(),
			},
		});

		bootstrapNode.addEventListener("peer:discovery", (peer) => {
			console.log("Discovered:", peer.detail);
		});

		bootstrapNode.addEventListener("peer:connect", (peer) => {
			console.log("bootstrap Connected:", peer.detail);
		})

		await bootstrapNode.start();

		// connect the client to the bootstrap node
		const bootstrapNodeAddr = bootstrapNode.getMultiaddrs()[0];

		const client1 = await createLibp2p({
			transports: [webSockets({})],
			peerDiscovery: [
				bootstrap({
					list: [bootstrapNodeAddr.toString()],
				}),
			],
			connectionEncrypters: [noise()],
			streamMuxers: [yamux()],
		});

		client1.addEventListener("peer:discovery", (peer) => {
			console.log("Client1 Discovered:", peer.detail);
		});

		const client2 = await createLibp2p({
			transports: [webSockets({})],
			peerDiscovery: [
				bootstrap({
					list: [bootstrapNodeAddr.toString()],
				}),
			],
			connectionEncrypters: [noise()],
			streamMuxers: [yamux()],
			services: {
				identify: identify({})
			}
		});

		client2.addEventListener("peer:discovery", (peer) => {
			console.log("Client2 Discovered:", peer.detail);
		});

		await client1.start();
		await client2.start();

		// wait for the connection to be established
	},
	{ timeout: 25000 },
);
