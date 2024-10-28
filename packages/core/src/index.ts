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

export const preRenderTask = async (
	template: string,
	placeholders: Record<string, any>,
): Promise<string> => {
	return template.replace(/{{(.*?)}}/g, (_, match) => placeholders[match]);
};

export class Batch {
	repetitions: number;
	validationRate: number;
	template: string;
	taskData: Array<Record<string, any>>;

	constructor({
		repetitions,
		validationRate,
		template,
		data,
	}: {
		repetitions: number;
		validationRate: number;
		template: string;
		data: Array<Record<string, any>>;
	}) {
		this.repetitions = repetitions;
		this.validationRate = validationRate;
		this.template = template;
		this.taskData = data;
	}

	extractTasks(): Task[] {
		return this.taskData.map((data) => {
			const id = nanoid();
			return new Task(id, this.template, data);
		});
	}
}

export class Task {
	id: string;
	template: string;
	data: Record<string, any>;
	result: string | null = null;

	static fromPayload(data: TaskPayload) {
		return new Task(data.id, data.template, data.data);
	}

	constructor(id: string, template: string, data: Record<string, any>) {
		this.id = id;
		this.template = template;
		this.data = data;
	}

	compile() {
		return preRenderTask(this.template, this.data);
	}

	toJSON() {
		return {
			id: this.id,
			template: this.template,
			data: this.data,
			result: this.result,
		};
	}
}
