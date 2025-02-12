import { describe, it, assert, expect } from "vitest";
import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { mdns } from "@libp2p/mdns";
import { tcp } from "@libp2p/tcp";
import { managerService } from "../src/core/src/service/manager/managerService";
import { TaskStore, workerService } from "../src/core/src";

const dummyTask = {
	id: "1",
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

			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(node1.peerId).to.not.equal(node2.peerId);
			expect(await node1.peerStore.all()).to.have.length(1);
			expect(await node2.peerStore.all()).to.have.length(1);
		});
	});

	describe("Libp2p: Effect AI Protocol", () => {
		it.concurrent("be able to receive a task", async () => {
			const [manager1] = await Promise.all([createManagerNode()]);
			const [worker1] = await Promise.all([createWorkerNode()]);

			await Promise.all([manager1.start(), worker1.start()]);

			await new Promise((resolve) => setTimeout(resolve, 100));

			await manager1.services.manager.sendTask(worker1.peerId, dummyTask);

			//wait for task to be received
			await new Promise((resolve) => setTimeout(resolve, 100));

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

			await new Promise((resolve) => setTimeout(resolve, 100));

			await manager1.services.manager.sendTask(worker1.peerId, dummyTask);

			//wait 2 seconds
			await new Promise((resolve) => setTimeout(resolve, 100));

			//complete task
			await worker1.services.worker.completeTask(
				dummyTask.id,
				"{'result': 'testing'}",
			);

			const result = await worker1.services.worker.taskStore.get(dummyTask.id);

			manager1.services.manager.addEventListener("task:received", (task) => {
				console.log("Task received", task.detail);
			});

			if (!result) {
				throw new Error("Task not found");
			}

			expect(result.result).equal("{'result': 'testing'}");
		});

		it.concurrent("manages a batch of tasks", async () => {});
	});
});
