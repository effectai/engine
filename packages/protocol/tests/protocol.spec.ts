import { describe, expect, it, test } from "vitest";
import { PublicKey } from "@solana/web3.js";

import { createManagerNode } from "../src/manager/factory.js";
import { createWorkerNode } from "../src/worker/factory.js";
import { TaskStatus } from "../src/task/task.js";

const dummyTask = (id: string) => ({
	taskId: id,
	reward: "500",
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
			"be able to receive a task",
			async () => {
				const [manager1] = await Promise.all([createManagerNode([])]);

				const relayAddress = manager1.getMultiaddrs()[0];
				await new Promise((resolve) => setTimeout(resolve, 100));

				const [w1] = await Promise.all([
					createWorkerNode([relayAddress.toString()]),
				]);

				// start the worker and wait for them to discover peers
				await Promise.all([w1.start()]);
				await new Promise((resolve) => setTimeout(resolve, 3000));

				const tasksToComplete = 10;
				for (let i = 0; i < tasksToComplete; i++) {
					console.log("Creating task", i);
					const dtask = dummyTask(i.toString());

					const result = await manager1.services.manager.processTask(dtask);
					await new Promise((resolve) => setTimeout(resolve, 1000));
					if (!result) {
						throw new Error("Task not accepted");
					}
					await w1.services.worker.completeTask(dtask, `{"result": "dummy"}`);
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));

				//expect to have 3 tasks in store with status completed
				const tasks = await manager1.services.manager.getTasks();

				console.log(
					"tasks completed:",
					tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
				);

				expect(tasks.length).toBe(tasksToComplete);
				expect(tasks.every((t) => t.status === TaskStatus.COMPLETED)).toBe(
					true,
				);

				await new Promise((resolve) => setTimeout(resolve, 3000));

				//expect to have enough payments in store.
				const payments = await w1.services.worker.getPayments();
				expect(payments.length).toBe(tasksToComplete);

				// request payment proof from manager
				await w1.services.worker.requestPaymentProof(manager1.peerId, payments);

				//wait 1 second
				await manager1.stop();
				await Promise.all([w1.stop()]);
			},
			{ timeout: 60000 },
		);
	});
});
