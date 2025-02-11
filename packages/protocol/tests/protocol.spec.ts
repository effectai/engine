import { describe, it, assert, expect } from "vitest";
import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { managerService } from "../src/core/src/service/manager/managerService";
import { pbStream } from "it-protobuf-stream";
import { Task } from "../src/core/src/protocol/task/task.js";
import { TaskStore, workerService } from "../src/core/src";

const dummyTask = {
	id: "1",
	template: `<form>
        <h2>Please submit the form to complete the task</h2>
        <input type='submit'>
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

const createManagerNode = () => {
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
		services: {
			manager: managerService(),
		},
	});
};

const createWorkerNode = () => {
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
		services: {
			worker: workerService(),
		},
	});
};

describe("Libp2p", () => {
	describe("Libp2p: Discovery", () => {
		it("should connect two nodes", async () => {
			const [node1, node2] = await Promise.all([createNode(), createNode()]);

			node1.addEventListener("peer:discovery", (evt) =>
				console.log("Discovered:", evt.detail.id.toString()),
			);
			node2.addEventListener("peer:discovery", (evt) =>
				console.log("Discovered:", evt.detail.id.toString()),
			);
		});
	});

	describe("Libp2p: Effect AI Protocol", () => {
		it.concurrent("be able to receive a task", async () => {
			const [manager1] = await Promise.all([createManagerNode()]);
			const [worker1] = await Promise.all([createWorkerNode()]);

			await Promise.all([manager1.start(), worker1.start()]);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			await manager1.services.manager.sendTask(worker1.peerId, dummyTask);
			//wait 2 seconds
			await new Promise((resolve) => setTimeout(resolve, 1000));

			//assert that worker1 received the task
			expect(
				await worker1.services.worker.taskStore.get(dummyTask.id),
			).to.deep.equal(dummyTask);

			await Promise.all([manager1.stop(), worker1.stop()]);
		});

		it.concurrent("is able to complete a task", async () => {
			const [manager1] = await Promise.all([createManagerNode()]);
			const [worker1] = await Promise.all([createWorkerNode()]);

			await Promise.all([manager1.start(), worker1.start()]);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			await manager1.services.manager.sendTask(worker1.peerId, dummyTask);

			//wait 2 seconds
			await new Promise((resolve) => setTimeout(resolve, 1000));

			//complete task
			await worker1.services.worker.completeTask(
				dummyTask.id,
				"{'result': 'testing'}",
			);

			const result = await worker1.services.worker.taskStore.get(dummyTask.id);

			if (!result) {
				throw new Error("Task not found");
			}

			expect(result.result).equal("{'result': 'testing'}");
		});
	});
});
