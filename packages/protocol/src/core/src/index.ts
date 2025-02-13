export { peerIdFromString } from "@libp2p/peer-id";
export {
	type Stream,
	type Connection,
	type Peer,
	type PeerId,
	type PeerStore,
	TypedEventEmitter,
} from "@libp2p/interface";
export type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
export { createLibp2p } from "libp2p";
export { webRTC } from "@libp2p/webrtc";
export { WebRTC } from "@multiformats/multiaddr-matcher";
export { webSockets } from "@libp2p/websockets";
export { noise } from "@chainsafe/libp2p-noise";
export { yamux } from "@chainsafe/libp2p-yamux";
export { bootstrap } from "@libp2p/bootstrap";
export { gossipsub } from "@chainsafe/libp2p-gossipsub";
export {
	pubSubPeerDiscovery,
	PeerType,
} from "./service/discovery/pubsub/index.js";
export { Uint8ArrayList } from "uint8arraylist";
export {
	circuitRelayTransport,
	circuitRelayServer,
} from "@libp2p/circuit-relay-v2";

export { identify, identifyPush } from "@libp2p/identify";
export { multiaddr, type Multiaddr } from "@multiformats/multiaddr";

export { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";

export { Buffer } from "node:buffer";

export * as filters from "@libp2p/websockets/filters";

export type { Libp2p } from "libp2p";

export { persistentPeerStore } from "@libp2p/peer-store";

export * from "./service/store/task.js";
export * from "./service/worker/workerService.js";
export * from "./service/manager/managerService.js";
export * from "./service/queue/peer.js";
export * from "./utils.js";

export { fromString } from "uint8arrays/from-string";
