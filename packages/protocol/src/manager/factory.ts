import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p } from "libp2p";
import { bootstrap } from "@libp2p/bootstrap";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { identify } from "@libp2p/identify";
import * as filters from "@libp2p/websockets/filters";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import type { PrivateKey } from "@libp2p/interface";
import { managerProtocol } from "./manager.js";
import { webTransport } from "@libp2p/webtransport";
import { autoTLS } from "@libp2p/auto-tls";
import { autoNAT } from "@libp2p/autonat";
import { keychain } from "@libp2p/keychain";
import { uPnPNAT } from "@libp2p/upnp-nat";

export const createManagerNode = (peers: string[], privateKey?: PrivateKey) => {
	return createLibp2p({
		...(privateKey && { privateKey }),
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/34859/wss"],
		},
		connectionGater: {
			denyDialMultiaddr: () => false,
		},
		transports: [webSockets({ filter: filters.all }), webTransport()],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [
			...(peers && peers.length > 0 ? [bootstrap({ list: peers })] : []),
		],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			manager: managerProtocol(),
			relay: circuitRelayServer(),
			// autoNAT: autoNAT(),
			// autoTLS: autoTLS(),
			// keychain: keychain(),
			// upnp: uPnPNAT(),
		},
	});
};
