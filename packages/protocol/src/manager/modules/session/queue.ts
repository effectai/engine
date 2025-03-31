import { TypedEventEmitter, type Peer } from "@libp2p/interface";

export interface PeerQueueEvents {
	"peer:added": CustomEvent<Peer>;
}

export class WorkerQueue extends TypedEventEmitter<PeerQueueEvents> {
	private queue: string[] = []; // Stores peerIds in a queue

	constructor() {
		super();
		this._initialize();
	}

	async _initialize() {}

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
