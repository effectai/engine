import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { peerIdFromString } from "@libp2p/peer-id";
import { createManager } from "./../src/manager/main.js";
import { createWorker } from "./../src/worker/main.js";
import { Datastore } from "interface-datastore";
import {
	createDataStore,
	delay,
	trackManagerEvents,
	trackWorkerEvents,
	waitForEvent,
} from "./utils.js";
import { randomBytes } from "crypto";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { PublicKey } from "@solana/web3.js";
import { Task } from "../src/common/index.js";

describe("Complete Task Lifecycle", () => {
	let manager: Awaited<ReturnType<typeof createManager>>;
	let worker: Awaited<ReturnType<typeof createWorker>>;
	let providerPeerId = peerIdFromString(
		"12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5",
	);
	let w_taskRecord;

	let managerDatastore: Datastore;
	let workerDatastore: Datastore;

	beforeAll(async () => {
		workerDatastore = await createDataStore("/tmp/worker-test");
		managerDatastore = await createDataStore("/tmp/manager-test");

		const managerPrivateKey = await generateKeyPairFromSeed(
			"Ed25519",
			randomBytes(32),
		);

		const workerPrivateKey = await generateKeyPairFromSeed(
			"Ed25519",
			randomBytes(32),
		);

		manager = await createManager({
			datastore: managerDatastore,
			privateKey: managerPrivateKey,
		});

		const managerMultiAddress = manager.node.getMultiAddress();

		worker = await createWorker({
			datastore: workerDatastore,
			privateKey: workerPrivateKey,
			bootstrap: [managerMultiAddress[0]],
			getSessionData: () => ({
				nonce: 1n,
				recipient: new PublicKey(randomBytes(32)).toString(),
			}),
		});

		// Connect manager and worker
		await manager.node.start();
		await worker.node.start();

		// wait for the nodes to be ready
		await delay(2000);
	});

	afterAll(async () => {
		await manager.node.stop();
		await worker.node.stop();

		await managerDatastore.close();
		await workerDatastore.close();
	});

	it("should complete the happy-path of the task flow", async () => {
		const testTask: Task = {
			id: "task-1",
			title: "Test Task",
			reward: 100n,
			timeLimitSeconds: 600, // 10 minutes
			templateId: "template-1",
			templateData: '{"key": "value"}',
		};

		// set up event tracking for testing
		const workerEvents = trackWorkerEvents(worker);
		const managerEvents = trackManagerEvents(manager);

		//manager creates task
		const taskRecord = await manager.taskStore.create({
			task: testTask,
			providerPeerId: providerPeerId,
		});

		//verify that task was created
		expect(taskRecord.state.id).toBe(testTask.id);
		expect(taskRecord.events[0].type).toBe("create");

		//assign task to worker peer.
		await manager.taskManager.assignTask({ taskRecord });

		//verify worker received assignment
		await waitForEvent(workerEvents.taskCreated);
		expect(workerEvents.taskCreated).toHaveBeenCalled();

		//get task from worker store and accept it.
		w_taskRecord = await worker.getTask({ taskId: testTask.id });
		await worker.acceptTask({
			taskRecord: w_taskRecord,
		});

		//verify acceptance
		await waitForEvent(managerEvents.taskAccepted);
		expect(managerEvents.taskAccepted).toHaveBeenCalled();

		//verify task state in manager
		const acceptedTask = await manager.taskStore.get({ entityId: testTask.id });
		expect(acceptedTask.events.some((e) => e.type === "accept")).toBe(true);

		//worker completes task
		const completionResult = "Task completed successfully";
		w_taskRecord = await worker.getTask({ taskId: testTask.id });
		await worker.completeTask({
			taskRecord: w_taskRecord,
			workerPeerId: worker.node.getPeerId(),
			result: completionResult,
		});

		//verify task submission inside manager
		await waitForEvent(managerEvents.taskSubmitted);
		expect(managerEvents.taskSubmitted).toHaveBeenCalled();

		//Manager processes task completion and payout
		const m_taskRecord = await manager.taskStore.get({ entityId: testTask.id });
		await manager.taskManager.manageTask(m_taskRecord);

		//verify that worker recieved payment
		await waitForEvent(workerEvents.paymentReceived);
		expect(workerEvents.paymentReceived).toHaveBeenCalled();

		//verify the final state of the completedTask in the manager store.
		const completedTask = await manager.taskStore.get({
			entityId: testTask.id,
		});
		expect(completedTask.events).toEqual([
			expect.objectContaining({ type: "create" }),
			expect.objectContaining({ type: "assign" }),
			expect.objectContaining({ type: "accept" }),
			expect.objectContaining({ type: "submission" }),
			expect.objectContaining({ type: "payout" }),
		]);
	}, 15000);

	it("should handle task rejection flow", async () => {
		//TODO::
	});
});
