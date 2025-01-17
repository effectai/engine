import { describe, it } from "vitest";
import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";

const createNode = () => {
	return createLibp2p({
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/0"],
		},
		transports: [tcp()],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
        peerDiscovery: [
			mdns({
				interval: 20e3,
			}),
		],
	});
};

describe("Libp2p", () => {
	describe("Libp2p: Discovery", () => {
		it(
			"should connect two nodes",
			async () => {
				const [node1, node2] = await Promise.all([createNode(), createNode()]);

				node1.addEventListener("peer:discovery", (evt) =>
					console.log("Discovered:", evt.detail.id.toString()),
				);
				node2.addEventListener("peer:discovery", (evt) =>
					console.log("Discovered:", evt.detail.id.toString()),
				);
			},
		);
	});

	describe("Libp2p: Effect AI Protocol", () => {
		it("be able to receive a task", async () => {
			
        }); 
	});
});
