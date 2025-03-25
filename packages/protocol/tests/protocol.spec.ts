import { describe, expect, it, test } from "vitest";
import { PublicKey } from "@solana/web3.js";

import { createManagerNode } from "../src/manager/factory.js";
import { createWorkerNode } from "../src/worker/factory.js";
import { TaskStatus } from "../src/task/task.js";
import { multiaddr } from "@multiformats/multiaddr";

const dummyTask = (id: string) => ({
	taskId: id,
	reward: 5_000_000n,
	manager: "",
	created: new Date().toISOString(),
	signature: "",
	status: TaskStatus.CREATED,
	template: `<form>
        <h2>Please submit the form to complete the task</h2>
        <input type='submit'/ >
        </form>`,
	data: new Map(),
	result: "",
});

describe("Libp2p", () => {
	describe("Libp2p: Effect AI Protocol", () => {
		test(
			"testing",
			async () => {
				const worker = await createWorkerNode([
					"/ip4/10.244.2.116/tcp/34859/ws/p2p/12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
				]);

				worker.addEventListener("peer:identify", (peerId) => {
					console.log("Discovered", peerId.detail);
				});

				await worker.start();
				const mm = multiaddr(
					"/ip4/10.244.2.116/tcp/34859/ws/p2p/12D3KooWFFNkqu7bETMX2qfdyi9t9T3fEYtqQXMTKtSt8Yw9jz5b",
				);

				//dial the manager
				const res = await worker.isDialable(mm);
				const result = await worker.dialProtocol(mm, "/effectai/manager/0.0.1");

				console.log(result);
				console.log("done!");
				//wait 10 seconds
				await new Promise((resolve) => setTimeout(resolve, 10000));
			},
			{ timeout: 60000 },
		);
		// test(
		// 	"be able to receive a task",
		// 	async () => {
		// 		const [manager1] = await Promise.all([createManagerNode([])]);
		//
		// 		const relayAddress = manager1.getMultiaddrs()[0];
		// 		await new Promise((resolve) => setTimeout(resolve, 100));
		//
		// 		const [w1] = await Promise.all([
		// 			createWorkerNode([relayAddress.toString()]),
		// 		]);
		//
		// 		// start the worker and wait for them to discover peers
		// 		await Promise.all([w1.start()]);
		// 		await new Promise((resolve) => setTimeout(resolve, 3000));
		//
		// 		const tasksToComplete = 10;
		// 		for (let i = 0; i < tasksToComplete; i++) {
		// 			console.log("Creating task", i);
		// 			const dtask = dummyTask(i.toString());
		//
		// 			const result = await manager1.services.manager.processTask(dtask);
		// 			if (!result) {
		// 				throw new Error("Task not accepted");
		// 			}
		// 			await w1.services.worker.completeTask(dtask, `{"result": "dummy"}`);
		//
		// 			await new Promise((resolve) => setTimeout(resolve, 1000));
		// 		}
		//
		// 		await new Promise((resolve) => setTimeout(resolve, 3000));
		//
		// 		//expect to have all tasks in store with status completed
		// 		const tasks = await manager1.services.manager.getTasks();
		//
		// 		expect(tasks.length).toBe(tasksToComplete);
		// 		expect(tasks.every((t) => t.status === TaskStatus.COMPLETED)).toBe(
		// 			true,
		// 		);
		//
		// 		//expect to have enough payments in store.
		// 		const payments = await w1.services.worker.getPayments();
		// 		expect(payments.length).toBe(tasksToComplete);
		//
		// 		// request payment proof from manager
		// 		const proof = await w1.services.worker.requestPaymentProof(
		// 			manager1.peerId,
		// 			payments,
		// 		);
		//
		// 		console.log("received proof from manager:", proof);
		//
		// 		await manager1.stop();
		// 		await Promise.all([w1.stop()]);
		// 	},
		// 	{ timeout: 60000 },
		// );
		// test(
		// 	"be able to receive a task",
		// 	async () => {
		// 		const [manager1] = await Promise.all([createManagerNode([])]);
		//
		// 		const relayAddress = manager1.getMultiaddrs()[0];
		// 		await new Promise((resolve) => setTimeout(resolve, 100));
		//
		// 		const [w1] = await Promise.all([
		// 			createWorkerNode([relayAddress.toString()]),
		// 		]);
		//
		// 		// start the worker and wait for them to discover peers
		// 		await Promise.all([w1.start()]);
		// 		await new Promise((resolve) => setTimeout(resolve, 3000));
		//
		// 		const tasksToComplete = 1;
		// 		for (let i = 0; i < tasksToComplete; i++) {
		// 			console.log("Creating task", i);
		// 			const dtask = dummyTask(i.toString());
		//
		// 			const result = await manager1.services.manager.processTask(dtask);
		// 			if (!result) {
		// 				throw new Error("Task not accepted");
		// 			}
		// 			await w1.services.worker.completeTask(dtask, `{"result": "dummy"}`);
		//
		// 			const tasks = await w1.services.worker.getTasks();
		// 			console.log(tasks);
		// 			await new Promise((resolve) => setTimeout(resolve, 1000));
		// 		}
		//
		// 		// await w1.services.worker.requestPayout(manager1.peerId);
		// 		// await new Promise((resolve) => setTimeout(resolve, 5000));
		// 		//
		// 		// await w1.services.worker.requestPayout(manager1.peerId);
		// 		// await new Promise((resolve) => setTimeout(resolve, 5000));
		// 		//
		// 		// await w1.services.worker.requestPayout(manager1.peerId);
		// 		//
		// 		await manager1.stop();
		// 		await Promise.all([w1.stop()]);
		// 	},
		// 	{ timeout: 60000 },
		// );
	});
});
