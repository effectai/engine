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

				const [w1, w2, w3] = await Promise.all([
					createWorkerNode([relayAddress.toString()]),
					createWorkerNode([relayAddress.toString()]),
					createWorkerNode([relayAddress.toString()]),
				]);

				// start the worker and wait for them to discover peers
				await Promise.all([w2.start(), w1.start(), w3.start()]);
				await new Promise((resolve) => setTimeout(resolve, 3000));

				for (let i = 0; i < 3; i++) {
					const dtask = dummyTask(i.toString());

					const result = await manager1.services.manager.processTask(dtask);

					await new Promise((resolve) => setTimeout(resolve, 100));

					if (!result) {
						throw new Error("Task not accepted");
					}

					for (const peer of [w1, w2, w3]) {
						if (peer.peerId.toString() === result.peer.toString()) {
							await peer.services.worker.completeTask(
								dtask,
								`{"result": "dummy"}`,
							);
						}
					}
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));

				//expect to have 3 tasks in store with status completed
				const tasks = await manager1.services.manager.getTasks();
				expect(tasks.length).toBe(3);
				expect(tasks.every((t) => t.status === TaskStatus.COMPLETED)).toBe(
					true,
				);

				//expect to have 1 payment in worker store
				const payments = await w1.services.worker.getPayments();
				expect(payments.length).toBe(1);

				//wait 1 second
				await manager1.stop();
				await Promise.all([w1.stop(), w2.stop(), w3.stop()]);
			},
			{ timeout: 20000 },
		);
	});
});
