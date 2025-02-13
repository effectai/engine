import {
	type Libp2pEvents,
	Peer,
	type PeerStore,
	type TypedEventTarget,
} from "@libp2p/interface";

export interface PeerQueueComponents {
	peerStore: PeerStore;
	events: TypedEventTarget<Libp2pEvents>;
}

export class PeerQueue {
	private queue: string[] = []; // Stores peerIds in a queue
	private components: PeerQueueComponents;

	constructor(components: PeerQueueComponents) {
		this.components = components;
		this._initialize();
	}

	async _initialize() {
		// Listen for peer:discovered events
		const peers = await this.components.peerStore.all();

		for (const peer of peers) {
			//only add peers that support the task protocol
			//cons
			console.log(peer.protocols);
			peer.protocols.includes("effectai/task/1.0.0") &&
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
				}
			},
		);
	}

	// Add a peer to the end of the queue
	enqueue(peerId: string) {
		if (!this.queue.includes(peerId)) {
			this.queue.push(peerId);
		}
	}

	// Get the next peer and move it to the end of the queue
	dequeue(): string | undefined {
		if (this.queue.length === 0) return undefined;
		const peer = this.queue.shift(); // Remove from the front
		if (peer) this.queue.push(peer); // Add back to the end
		return peer;
	}

	// Remove a peer from the queue (e.g., if it disconnects)
	remove(peerId: string) {
		this.queue = this.queue.filter((id) => id !== peerId);
	}

	// Get the current queue state
	getQueue() {
		return [...this.queue];
	}
}

export function createPeerQueue(): (
	// init: Partial<TaskManagerInit> = {}
	components: PeerQueueComponents,
) => PeerQueue {
	return (components: PeerQueueComponents) => new PeerQueue(components);
}
