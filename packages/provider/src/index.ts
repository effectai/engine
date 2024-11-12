import {
	Libp2pNode,
	circuitRelayTransport,
	pubSubPeerDiscovery,
	createLibp2p,
	filters,
	gossipsub,
	identify,
	noise,
	webRTC,
	webSockets,
	yamux,
	bootstrap,
	type Libp2p,
	type Batch,
	type Multiaddr,
	PeerType,
} from "@effectai/task-core";
import { pipe } from "it-pipe";

type ProviderNodeState = {
	providerAddress: string;
};

export class ProviderNode extends Libp2pNode<ProviderNodeState> {
	constructor(node: Libp2p) {
		super(node, { providerAddress: "" });
		this.node = node;
	}

	async offerBatch(address: Multiaddr, batch: Batch) {
		const stream = await offerBatch(this.node, address, batch);

		if(!stream) {
			throw new Error("Stream not available");
		}

		// wait for the batch to be accepted
		const response = await pipe(stream.source, async (source) => {
			for await (const msg of source) {
					const { t,d } = JSON.parse(
						new TextDecoder().decode(msg.subarray()),
					);

                    if(t === "batch-accepted") {
                        console.log("Batch accepted");
                    }
			}
		});

        // TODO:: handle the response
	}
}

export const createProviderNode = async (bootstrapNodes: string[] = []) => {
	const node = await createLibp2p({
		addresses: {
			listen: ["/p2p-circuit", "/webrtc"],
		},
		connectionGater: {
			denyDialMultiaddr: async () => false,
		},
		transports: [
			webSockets({ filter: filters.all }),
			webRTC(),
			circuitRelayTransport(),
		],
		peerDiscovery: [
			pubSubPeerDiscovery({
				type: PeerType.Provider,
				topics: ["provider-manager-discovery"],
			}),
			bootstrap({
				list: bootstrapNodes,
			}),
		],
		connectionEncrypters: [noise()],
		streamMuxers: [yamux()],
		services: {
			identify: identify(),
			pubsub: gossipsub({
				allowPublishToZeroTopicPeers: true,
			}),
		},
	});

	return new ProviderNode(node);
};

// Offer a batch to the supplied address
export const offerBatch = async (
	provider: Libp2p,
	address: Multiaddr,
	batch: Batch,
) => {
	try {
		const stream = await provider.dialProtocol(
			address,
			"/effect-ai/task/1.0.0",
		);
		const offerBatchMessage = JSON.stringify({ t: "batch", d: batch.toJSON() });
		stream.sink([Buffer.from(offerBatchMessage)]);
		return stream;
	} catch (e) {
		console.error(e);
	}
};
