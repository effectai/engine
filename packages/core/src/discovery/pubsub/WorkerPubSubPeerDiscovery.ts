import {
	NotFoundError,
	TypedEventEmitter,
	peerDiscoverySymbol,
} from "@libp2p/interface";
import type {
	PeerDiscovery,
	PeerDiscoveryEvents,
	PeerId,
	PeerInfo,
	Message,
	PubSub,
	Startable,
	ComponentLogger,
	Logger,
	PeerStore,
} from "@libp2p/interface";
import {
	publicKeyFromProtobuf,
	publicKeyToProtobuf,
} from "@libp2p/crypto/keys";
import type { AddressManager } from "@libp2p/interface-internal";
import { Peer as PBPeer, PeerType } from "./peer.js";
import { peerIdFromPublicKey } from "@libp2p/peer-id";
import { multiaddr } from "@multiformats/multiaddr";

export interface PubSubPeerDiscoveryComponents {
	peerId: PeerId;
	pubsub?: PubSub;
	addressManager: AddressManager;
	peerStore: PeerStore;
	logger: ComponentLogger;
}

export interface WorkerPubSubPeerDiscoveryOptions {
	/**
	 * How often (ms) we should broadcast our infos
	 */
	interval?: number;

	/**
	 * If true, we will broadcast messages without subscribing to the topic
	 * @default false
	 * @example
	 * ```js
	 */
	broadcastWithoutSubscribing?: boolean;
	/**
	 * The type of the node
	 */
	type: "worker" | "manager" | "relay";
}

export class WorkerPubSubPeerDiscovery
	extends TypedEventEmitter<PeerDiscoveryEvents>
	implements PeerDiscovery, Startable
{
	private readonly components: PubSubPeerDiscoveryComponents;
	private readonly interval: number;
	private intervalId?: ReturnType<typeof setInterval>;
	private topics: string[] = [];
	private broadcastWithoutSubscribing: boolean;
	private type: WorkerPubSubPeerDiscoveryOptions["type"];

	constructor(
		components: PubSubPeerDiscoveryComponents,
		initOptions: WorkerPubSubPeerDiscoveryOptions,
	) {
		super();

		this.components = components;
		this.type = initOptions.type;
		this.broadcastWithoutSubscribing =
			initOptions.broadcastWithoutSubscribing || false;

		this.interval = initOptions.interval || 3000;
		this.topics = ["worker-discovery:pubsub"];
	}

	beforeStart(): void | Promise<void> {
		// throw new Error('Method not implemented.')
		console.log("starting..");
	}

	start(): void | Promise<void> {
		// start
	}

	afterStart(): void | Promise<void> {
		if (this.intervalId != null) {
			return;
		}

		// subscribe to topics
		const pubsub = this.components.pubsub;

		if (pubsub == null) {
			throw new Error("PubSub not configured");
		}

		for (const topic of this.topics) {
			if (!this.broadcastWithoutSubscribing) {
				pubsub.subscribe(topic);
				pubsub.addEventListener("message", (event) => this._onMessage(event));
			}
		}

		this._broadcastMessage();

		this.intervalId = setInterval(() => {
			this._broadcastMessage();
		}, this.interval);
	}

	beforeStop(): void | Promise<void> {
		const pubsub = this.components.pubsub;

		if (pubsub == null) {
			throw new Error("PubSub not configured");
		}

		for (const topic of this.topics) {
			pubsub.unsubscribe(topic);
			pubsub.removeEventListener("message", this._onMessage);
		}
	}

	stop(): void | Promise<void> {
		if (this.intervalId != null) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	_onMessage(event: CustomEvent<Message>): void {
		const message = event.detail;

		try {
			const peer = PBPeer.decode(message.data);
			const publicKey = publicKeyFromProtobuf(peer.publicKey);
			const peerId = peerIdFromPublicKey(publicKey);

			// ignore worker messages if we are a worker or if the message is from us
			// or if we are a manager, we should ignore messages from other managers
			if (
				(this.type === "worker" && peer.peerType === PeerType.Worker) ||
				(this.type === "manager" && peer.peerType === PeerType.Manager) ||
				peerId.equals(this.components.peerId)
			) {
				return;
			}

			// check if this peer is already in the peer store, if so update the tags
			this.components.peerStore
				.get(peerId)
				.then((p) => {
					if (peer) {
						this.components.peerStore.merge(peerId, {
							tags: {
								peerType: { value: peer.peerType },
							},
						});
					}
				})
				.catch((e) => {
					console.log("Error while getting peer from peer store", e);
				});

			this.safeDispatchEvent<PeerInfo>("peer", {
				detail: {
					id: peerId,
					multiaddrs: peer.addrs.map((b) => multiaddr(b)),
				},
			});
		} catch (err) {
			console.error("Failed to decode peer message", err);
		}
	}

	_broadcastMessage(): void {
		const peerId = this.components.peerId;

		if (!peerId.publicKey) {
			throw new Error("Cannot broadcast message without a public key");
		}

		const peer = {
			publicKey: publicKeyToProtobuf(peerId.publicKey),
			peerType:
				this.type === "worker"
					? PeerType.Worker
					: this.type === "manager"
						? PeerType.Manager
						: PeerType.Relay,
			addrs: this.components.addressManager
				.getAddresses()
				.map((ma) => ma.bytes),
		};

		const encodedPeer = PBPeer.encode(peer);

		const pubsub = this.components.pubsub;

		if (pubsub == null) {
			throw new Error("PubSub not configured");
		}

		for (const topic of this.topics) {
			pubsub.publish(topic, encodedPeer);
		}
	}
}

export function workerPubSubPeerDiscovery(
	options: WorkerPubSubPeerDiscoveryOptions = { type: "worker" },
): (components: PubSubPeerDiscoveryComponents) => PeerDiscovery {
	return (components: PubSubPeerDiscoveryComponents) =>
		new WorkerPubSubPeerDiscovery(components, options);
}
