export { peerIdFromString } from "@libp2p/peer-id";

export type { Stream, Connection, Peer } from "@libp2p/interface";
export { createLibp2p } from "libp2p";
export { webRTC } from "@libp2p/webrtc";
export { WebRTC } from "@multiformats/multiaddr-matcher";
export { webSockets } from "@libp2p/websockets";
export { noise } from "@chainsafe/libp2p-noise";
export { yamux } from "@chainsafe/libp2p-yamux";
export { bootstrap } from '@libp2p/bootstrap'
export { gossipsub } from '@chainsafe/libp2p-gossipsub'
export {workerPubSubPeerDiscovery} from './discovery/pubsub/WorkerPubSubPeerDiscovery.js'
export {
	circuitRelayTransport,
	circuitRelayServer,
} from "@libp2p/circuit-relay-v2";
export { identify, identifyPush } from "@libp2p/identify";
export { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
export * as filters from "@libp2p/websockets/filters";
export type { Libp2p } from "libp2p";
export { Libp2pNode, NodeEventMap } from "./Libp2pNode.js";
export { kadDHT, removePrivateAddressesMapper, removePublicAddressesMapper } from "@libp2p/kad-dht";
import { nanoid } from "nanoid";
export { persistentPeerStore } from '@libp2p/peer-store'

export type TaskPayload = {
	id: string;
	template: string;
	data: Record<string, any>;
};

export type TaskFlowMessage = {
	d: Record<string, any>;
	t: "task-accepted" | "task-completed" | "task-rejected" | "task";
};

export const preRenderTask = (
	template: string,
	placeholders: Record<string, any>,
): string => {
	return template.replace(/{{(.*?)}}/g, (_, match) => placeholders[match]);
};
