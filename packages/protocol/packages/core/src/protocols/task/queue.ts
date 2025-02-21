import {
	TypedEventEmitter,
	type Libp2pEvents,
	type Peer,
	type PeerStore,
	type TypedEventTarget,
} from "@libp2p/interface";

export interface PeerQueueComponents {
	peerStore: PeerStore;
	events: TypedEventTarget<Libp2pEvents>;
}

export interface PeerQueueEvents {
	"peer:added": CustomEvent<Peer>;
}

export class WorkerQueue extends TypedEventEmitter<PeerQueueEvents> {
	private queue: string[] = []; // Stores peerIds in a queue
	private components: PeerQueueComponents;

	constructor(components: PeerQueueComponents) {
		super();
		this.components = components;
		this._initialize();
	}

	async _initialize() {
		// Listen for peer:discovered events
		const peers = await this.components.peerStore.all();

		for (const peer of peers) {
			peer.protocols.includes("effectai/task/0.0.1") &&
				this.enqueue(peer.id.toString());
		}

		this.components.events.addEventListener(
			"peer:update",
			async ({ detail }) => {
				//check if peerType is worker
				const val = detail.peer.metadata.get("nodeType");

				//if peer is not in the queue and is a worker, add it to the queue
				if (
					val !== undefined &&
					val[0] === 0 &&
					!this.queue.includes(detail.peer.id.toString())
				) {
					this.enqueue(detail.peer.id.toString());
					this.safeDispatchEvent("peer:added", { detail: detail.peer });
				}
			},
		);

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
) => WorkerQueue {
	return (components: PeerQueueComponents) => new WorkerQueue(components);
}
