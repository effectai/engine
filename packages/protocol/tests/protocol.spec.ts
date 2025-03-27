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
				const manager = await createManagerNode([]);

				manager.addEventListener("peer:discovery", (peer) => {
					console.log("Discovered:", peer);
				});

				await manager.start();
				const managerAddress = manager.getMultiaddrs();

				console.log(
					"Manager address:",
					managerAddress.map((a) => a.toString()),
				);

				await new Promise((resolve) => setTimeout(resolve, 500));
				const multi = `/dns4/codifex.nl/tcp/34859/ws/p2p/${manager.peerId.toString()}`;
				const addr = multiaddr(multi);

				console.log(managerAddress[0].toString());
				const worker = await createWorkerNode([addr]);
				await worker.start();

				//check if dialable
				const result = await worker.isDialable(addr);
				console.log("Is dialable:", result);
				expect(result).toBe(true);
				await new Promise((resolve) => setTimeout(resolve, 3500));
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
