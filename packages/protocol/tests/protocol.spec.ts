import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { createLibp2p } from "libp2p";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { describe, it } from "vitest";
import {
	bootstrap,
	circuitRelayServer,
	circuitRelayTransport,
	createPeerQueue,
	taskStore,
	webSockets,
	workerService,
} from "../src/core/src";
import { taskProtocol } from "../src/core/src/protocols/task/task";
import { managerService } from "../src/core/src/service/manager/managerService";
import { announcePeerDiscovery } from "../src/core/src/service/pubsub/announce";
import type { Task } from "../src/core/src/protocols/task/pb/task";

const dummyTask: Task = {
	id: "1",
	owner: "0x123",
	repetition: 1,
	reward: "500",
	manager: "",
	template: `<form>
        <h2>Please submit the form to complete the task</h2>
        <input type='submit'/ >
        </form>`,
	data: new Map(),
	result: "",
};

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

const createManagerNode = (peers: string[]) => {
	return createLibp2p({
		addresses: {
			listen: ["/ip4/0.0.0.0/tcp/0/ws"],
		},
		transports: [webSockets()],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [
			...(peers && peers.length > 0 ? [bootstrap({ list: peers })] : []),
			announcePeerDiscovery(),
		],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			taskStore: taskStore(),
			task: taskProtocol(),
			manager: managerService(),
			peerQueue: createPeerQueue(),
			relay: circuitRelayServer(),
		},
	});
};

const createWorkerNode = (peers: string[]) => {
	return createLibp2p({
		addresses: {
			listen: ["/p2p-circuit"],
		},
		transports: [webSockets(), circuitRelayTransport()],
		streamMuxers: [yamux()],
		connectionEncrypters: [noise()],
		peerDiscovery: [announcePeerDiscovery(), bootstrap({ list: peers })],
		services: {
			pubsub: gossipsub(),
			identify: identify(),
			taskStore: taskStore(),
			task: taskProtocol(),
			worker: workerService(),
		},
	});
};

describe("Libp2p", () => {
	describe("Libp2p: Effect AI Protocol", () => {
		it.concurrent(
			"be able to receive a task",
			async () => {
				const [manager1] = await Promise.all([createManagerNode([])]);

				const relayAddress = manager1.getMultiaddrs()[0];
				await new Promise((resolve) => setTimeout(resolve, 100));

				const [w1, w2, w3] = await Promise.all([
					createWorkerNode([relayAddress.toString()]),
					createWorkerNode([relayAddress.toString()]),
					createWorkerNode([relayAddress.toString()]),
				]);

				// start the worker and wait for them to discover peers
				await Promise.all([w2.start(), w1.start(), w3.start()]);
				await new Promise((resolve) => setTimeout(resolve, 3000));

				for (let i = 0; i < 3; i++) {
					const result = await manager1.services.manager.processTask(dummyTask);

					if (!result) {
						throw new Error("Task processing failed");
					}

					await new Promise((resolve) => setTimeout(resolve, 100));

					for (const peer of [w1, w2, w3]) {
						if (peer.peerId.toString() === result.peer.id.toString()) {
							await peer.services.worker.completeTask(
								dummyTask.id,
								`Task completed by ${peer.peerId.toString()}`,
							);
						}
					}
				}
			},
			{ timeout: 20000 },
		);
	});
});
