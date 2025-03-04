import { describe, it } from "vitest";
import {
	TaskStatus,
	type Task,
	createDummyPayments,
	signPayment,
	Payment,
} from "../packages/core/src";

import { createManagerNode } from "../packages/manager/src/index.ts";
import { createWorkerNode } from "../packages/worker/src/index.ts";

const dummyTask = (id: string) => ({
	id,
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
					const dtask = dummyTask(i.toString());

					const result = await manager1.services.manager.processTask(dtask);

					if (!result) {
						throw new Error("Task processing failed");
					}

					await new Promise((resolve) => setTimeout(resolve, 100));

					for (const peer of [w1, w2, w3]) {
						if (peer.peerId.toString() === result.peer.id.toString()) {
							await peer.services.worker.completeTask(
								dtask.id,
								`{"worker": "${peer.peerId.toString()}", "result": "dummy"}`,
							);
						}
					}
				}

				//wait 1 second
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const tasks = await manager1.services.taskStore.all();
				console.log(tasks);

				manager1.stop();
			},
			{ timeout: 20000 },
		);
	});

	it("creates a payment", async () => {
		const manager = await createManagerNode([]);

		const [payment] = createDummyPayments({
			n: 1,
			mint: "EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E",
			recipient: "jeffCRA2yFkRbuw99fBxXaqE5GN3DwjZtmjV18McEDf",
			paymentAccount: "blabla",
		});

		const authority = manager.peerId.publicKey?.raw;

		if (!authority) {
			throw new Error("Authority not found");
		}

		const { signature, message, serializedPayment } = await signPayment(
			payment,
			authority,
		);

		console.log("Payment", serializedPayment);
		console.log("Signature", signature);
		console.log("Message", message);
	});
});
