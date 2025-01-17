// This libp2p service is responsible for Queueing/Dequeueing a Peer (worker, manager, etc.)
// and syncing it with the network through pubsub
// resolve issues using a Last Write Wins (LWW) strategy
import { type PeerDiscoveryEvents, TypedEventEmitter, type Message, type Peer, type PubSub, type Startable } from "@libp2p/interface";
import type { PeerType } from "../discovery/pubsub/peer.js";

export interface DistributedNodeQueueServiceComponents {
	pubsub?: PubSub;
}

export type QueueMessage<Entity> = {
	type: "queue";
	entity: Entity;
	timestamp: number;
};

export interface DistributedNodeQueueServiceOptions {
	/**
	 * How often (ms) we should broadcast our infos
	 */
	interval?: number;

	/**
	 * The type of the node
	 */
	peerType: PeerType;
}

export class DistributedNodeQueueService extends TypedEventEmitter<PeerDiscoveryEvents> implements Startable {
	private readonly components: DistributedNodeQueueServiceComponents;
	private q: Peer[];
	private lastUpdateTimestamp: number; // Timestamp of the last successful queue update
	private readonly interval: number;
	private readonly peerType: DistributedNodeQueueServiceOptions["peerType"];
	private intervalId?: ReturnType<typeof setInterval>;

	constructor(
		components: DistributedNodeQueueServiceComponents,
		options: DistributedNodeQueueServiceOptions,
	) {
		super();
		this.components = components;
		this.q = [];
		this.lastUpdateTimestamp = Date.now();
		this.peerType = options.peerType;
		this.interval = options.interval || 3000;
	}

	start(): void | Promise<void> {
		console.log("Starting DistributedNodeQueueService");
	}

	beforeStop?(): void | Promise<void> {
		const pubsub = this.components.pubsub;

		if (pubsub == null) {
			throw new Error("PubSub not configured");
		}

		pubsub.unsubscribe("node-queue-updates");
		pubsub.removeEventListener("message", this._onMessage);
	}

	stop(): void | Promise<void> {
		if (this.intervalId != null) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	beforeStart() {
		// subscribe to the pubsub topic
		if (!this.components.pubsub) {
			throw new Error("PubSub not configured");
		}

		this.components.pubsub.subscribe("node-queue-updates");
		this.components.pubsub.addEventListener("message", (msg) =>
			this._onMessage(msg),
		);

		this._broadcastMessage();

		this.intervalId = setInterval(() => {
			this._broadcastMessage();
		}, this.interval);
	}

	// Queue an entity
	queue(entity: Peer) {
		if (entity.tags.get("peerType")?.value !== this.peerType) {
			return;
		}

		this.q.push(entity);
	}

	// Dequeue an entity
	dequeue(): Peer | undefined {
		const entity = this.q.shift();
		console.log("Entity dequeued:", entity);
		// After removing the entity, broadcast the updated queue
		this._broadcastMessage();
		return entity;
	}

	// Handle incoming messages
	_onMessage(event: CustomEvent<Message>) {
		try {
			const parsedMessage: QueueMessage<Peer> = JSON.parse(event.toString());

			if (parsedMessage.type === "queue") {
				// If the incoming message has a newer timestamp, adopt it
				if (parsedMessage.timestamp > this.lastUpdateTimestamp) {
					console.log("Adopting newer queue update:", parsedMessage);
					// Apply the update (this assumes entity is being appended, but this can be modified as needed)
					this.q.push(parsedMessage.entity);
					this.lastUpdateTimestamp = parsedMessage.timestamp; // Update last timestamp
					this._broadcastMessage(); // Broadcast updated queue state
				} else {
					console.log("Ignoring older queue update:", parsedMessage);
				}
			}
		} catch (err) {
			console.error("Failed to process incoming message:", err);
		}
	}

	async broadcastQueue() {
		if (!this.components.pubsub) {
			throw new Error("PubSub not configured");
		}

		this._broadcastMessage();
	}

	// Broadcast a message to the network
	async _broadcastMessage() {
		if (this.components.pubsub) {
			const message: QueueMessage<Peer> = {
				type: "queue",
				entity: this.q[0], // broadcasting the current state of the queue (first entity in the queue)
				timestamp: Date.now(),
			};

			const messageBuffer = Buffer.from(JSON.stringify(message));

			try {
				await this.components.pubsub.publish(
					"node-queue-updates",
					messageBuffer,
				);

				console.log("Broadcasted message:", message);
			} catch (err) {
				console.error("Failed to broadcast message:", err);
			}
		}
	}
}

export function distributedNodeQueueService(
	options: Partial<DistributedNodeQueueServiceOptions> = {},
): (
	components: DistributedNodeQueueServiceComponents,
) => DistributedNodeQueueService {
	return (components: DistributedNodeQueueServiceComponents) =>
		new DistributedNodeQueueService(
			components,
			options as DistributedNodeQueueServiceOptions,
		);
}
