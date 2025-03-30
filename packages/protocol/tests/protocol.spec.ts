import { describe, expect, it, test } from "vitest";

import { createManagerNode } from "../src/manager/factory.js";
import { createWorkerNode } from "../src/worker/create.js";
import { TaskStatus } from "../src/common/proto/effect.js";
import { multiaddr } from "@multiformats/multiaddr";
import { PublicKey } from "@solana/web3.js";

const dummyTask = (id: string) => ({
	taskId: id,
	reward: 5_000_000n,
	title: "Dummy Task",
	createdAt: new Date().toISOString(),
	status: TaskStatus.PENDING,
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
				const [manager1] = await Promise.all([createManagerNode([])]);
				const relayAddress = manager1.getMultiaddrs()[0];
				await new Promise((resolve) => setTimeout(resolve, 100));

				const [worker] = await Promise.all([
					createWorkerNode({
						peers: [relayAddress.toString()],
						onPairRequest: async () => ({
							recipient: new PublicKey(
								"jeffCRA2yFkRbuw99fBxXaqE5GN3DwjZtmjV18McEDf",
							),
							nonce: 1n,
						}),
					}),
				]);

				// start the worker and wait for them to discover peers
				await Promise.all([worker.start()]);
				await new Promise((resolve) => setTimeout(resolve, 5000));

				const tasksToComplete = 2;
				for (let i = 0; i < tasksToComplete; i++) {
					const dtask = dummyTask(i.toString());

					const task = await manager1.services.manager.onReceiveNewTask(dtask);
					await manager1.services.manager.manageTask(task);
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));

				await worker.services.worker.actions?.acceptTask({
					taskId: "0",
				});

				await new Promise((resolve) => setTimeout(resolve, 1000));

				// await worker.services.worker.actions?.completeTask({});

				if (!worker.services.worker.actions) {
					throw new Error("Worker actions not available");
				}

				const { payment } = await worker.services.worker.actions.requestPayout({
					managerPeer: manager1.peerId,
				});

				console.log("got payment", payment);

				await new Promise((resolve) => setTimeout(resolve, 3000));

				await manager1.stop();
				await Promise.all([worker.stop()]);
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
