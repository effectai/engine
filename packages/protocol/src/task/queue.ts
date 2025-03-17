import {
	TypedEventEmitter,
	type Libp2pEvents,
	type Peer,
	type PeerStore,
	type TypedEventTarget,
} from "@libp2p/interface";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "../worker/consts.js";

export interface PeerQueueComponents {
	peerStore: PeerStore;
	events: TypedEventTarget<Libp2pEvents>;
}

export interface PeerQueueEvents {
	"peer:added": CustomEvent<Peer>;
}

export class WorkerTaskQueue extends TypedEventEmitter<PeerQueueEvents> {
	private queue: string[] = []; // Stores peerIds in a queue
	private components: PeerQueueComponents;

	constructor(components: PeerQueueComponents) {
		super();
		this.components = components;
		this._initialize();
	}

	async _initialize() {
		this.components.events.addEventListener("peer:disconnect", ({ detail }) => {
			this.remove(detail.toString());
		});
	}

	enqueue(peerId: string) {
		if (!this.queue.includes(peerId)) {
			this.queue.push(peerId);
		}
	}

	dequeue(): string | undefined {
		if (this.queue.length === 0) return undefined;
		const peer = this.queue.shift(); // Remove from the front
		if (peer) this.queue.push(peer); // Add back to the end
		return peer;
	}

	remove(peerId: string) {
		this.queue = this.queue.filter((id) => id !== peerId);
	}

	getQueue() {
		return [...this.queue];
	}
}

export function workerQueue(): (
	// init: Partial<TaskManagerInit> = {}
	components: PeerQueueComponents,
) => WorkerTaskQueue {
	return (components: PeerQueueComponents) => new WorkerTaskQueue(components);
}
