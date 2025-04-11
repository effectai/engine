import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { peerIdFromString } from "@libp2p/peer-id";
import { createManager } from "./../src/manager/main.js";
import { createWorker } from "./../src/worker/main.js";
import type { Datastore } from "interface-datastore";
import {
  createDataStore,
  createDummyTemplate,
  delay,
  trackManagerEvents,
  trackWorkerEvents,
  waitForEvent,
} from "./utils.js";
import { randomBytes } from "node:crypto";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { PublicKey } from "@solana/web3.js";
import type { Task, Template } from "../src/core/messages/effect.js";
import type { WorkerTaskRecord } from "../src/worker/stores/workerTaskStore.js";

import { promises } from "node:fs";

describe("Complete Task Lifecycle", () => {
  let manager: Awaited<ReturnType<typeof createManager>>;
  let worker: Awaited<ReturnType<typeof createWorker>>;
  const providerPeerId = peerIdFromString(
    "12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5",
  );

  let managerPeerId: string;
  let workerTaskRecord: WorkerTaskRecord;

  let managerDatastore: Datastore;
  let workerDatastore: Datastore;

  beforeEach(async () => {
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

    worker = await createWorker({
      datastore: workerDatastore,
      privateKey: workerPrivateKey,
      getSessionData: () => ({
        nonce: 1n,
        recipient: new PublicKey(randomBytes(32)).toString(),
      }),
    });

    // start manager and worker
    await manager.start();
    await worker.start();

    managerPeerId = manager.entity.getPeerId().toString();
    // connect worker to manager
    const managerMultiAddress = manager.entity.getMultiAddress();
    if (!managerMultiAddress?.[0]) {
      throw new Error("manager multiaddress not found");
    }
    await worker.connect(managerMultiAddress[0]);
    // wait for the nodes to be ready
    await delay(2000);
  });

  afterEach(async () => {
    await manager.stop();
    await worker.stop();

    await managerDatastore.close();
    await workerDatastore.close();

    await promises.rm("/tmp/worker-test", { recursive: true, force: true });
    await promises.rm("/tmp/manager-test/", {
      recursive: true,
      force: true,
    });
  });

  it("should complete the happy-path of the task flow", async () => {
    const { template, templateId } = createDummyTemplate(
      providerPeerId.toString(),
    );
    // register template
    await manager.templateManager.registerTemplate({
      providerPeerIdStr: providerPeerId.toString(),
      template,
    });

    const testTask: Task = {
      id: "task-1",
      title: "Test Task",
      reward: 100n,
      timeLimitSeconds: 600, // 10 minutes
      templateId: templateId,
      templateData: '{"test": "test variable 1"}',
    };

    // set up event tracking for testing
    const workerEvents = trackWorkerEvents(worker);
    const managerEvents = trackManagerEvents(manager);

    //manager creates task
    const taskRecord = await manager.taskManager.createTask({
      task: testTask,
      providerPeerIdStr: providerPeerId.toString(),
    });

    //verify that task was created
    expect(taskRecord.state.id).toBe(testTask.id);
    expect(taskRecord.events[0].type).toBe("create");

    //assign task to worker peer.
    await manager.taskManager.assignTask({ taskRecord });

    //verify that worker received task assignment
    await waitForEvent(workerEvents.taskCreated);
    expect(workerEvents.taskCreated).toHaveBeenCalled();

    //get task from worker store and let worker accept it.
    workerTaskRecord = await worker.getTask({ taskId: testTask.id });
    await worker.acceptTask({
      taskId: testTask.id,
    });

    //verify that manager registered the accept
    await waitForEvent(managerEvents.taskAccepted);
    expect(managerEvents.taskAccepted).toHaveBeenCalled();
    const acceptedTask = await manager.taskManager.getTask({
      taskId: testTask.id,
    });
    expect(acceptedTask.events.some((e) => e.type === "accept")).toBe(true);

    //let worker complete task
    const completionResult = "Task completed successfully";
    workerTaskRecord = await worker.getTask({ taskId: testTask.id });
    await worker.completeTask({
      taskId: testTask.id,
      result: completionResult,
    });

    //verify task submission inside manager
    await waitForEvent(managerEvents.taskSubmitted);
    expect(managerEvents.taskSubmitted).toHaveBeenCalled();

    //Manager processes task completion and payout
    const managerTaskRecord = await manager.taskManager.getTask({
      taskId: testTask.id,
    });
    await manager.taskManager.manageTask(managerTaskRecord);

    //verify that worker recieved payment
    await waitForEvent(workerEvents.paymentReceived);
    expect(workerEvents.paymentReceived).toHaveBeenCalled();

    //verify the final state of the completed task in the manager store.
    const completedTask = await manager.taskManager.getTask({
      taskId: testTask.id,
    });

    expect(completedTask.events).toEqual([
      expect.objectContaining({ type: "create" }),
      expect.objectContaining({ type: "assign" }),
      expect.objectContaining({ type: "accept" }),
      expect.objectContaining({ type: "submission" }),
      expect.objectContaining({ type: "payout" }),
    ]);
  }, 15000);

  it("requests a template from the manager", async () => {
    const workerEvents = trackWorkerEvents(worker);

    const { template, templateId } = createDummyTemplate(
      providerPeerId.toString(),
    );

    await manager.templateManager.registerTemplate({
      providerPeerIdStr: providerPeerId.toString(),
      template,
    });

    const testTask: Task = {
      id: "task-1",
      title: "Test Task",
      reward: 100n,
      timeLimitSeconds: 600, // 10 minutes
      templateId: templateId,
      templateData: '{"test": "test variable 1"}',
    };

    //manager creates task
    const taskRecord = await manager.taskManager.createTask({
      task: testTask,
      providerPeerIdStr: providerPeerId.toString(),
    });

    //verify that task was created
    expect(taskRecord.state.id).toBe(testTask.id);
    expect(taskRecord.events[0].type).toBe("create");

    //assign task to worker peer.
    await manager.taskManager.assignTask({ taskRecord });

    //verify that worker received task assignment
    await waitForEvent(workerEvents.taskCreated);

    const workerTaskRecord = await worker.getTask({
      taskId: testTask.id,
    });

    if (!workerTaskRecord) {
      throw new Error("worker task record not found");
    }

    //let worker render the task
    const templateHtml = await worker.renderTask({
      taskRecord: workerTaskRecord,
    });

    //verify that the worker rendered the task
    expect(templateHtml).toContain("test variable 1");
  });

  it(
    "should correctly handle payout flow",
    async () => {
      const workerEvents = trackWorkerEvents(worker);

      //lets request n payouts from manager
      const n = 2;
      for (let i = 0; i < n; i++) {
        await worker.requestPayout({
          managerPeer: peerIdFromString(managerPeerId),
        });
      }

      //verify that manager processed payout request
      await waitForEvent(workerEvents.paymentReceived);
      expect(workerEvents.paymentReceived).toHaveBeenCalledTimes(n);

      //verify that we have n payments in our store
      const payments = await worker.getPayments();
      expect(payments.length).toBe(n);

      //lets batch these payments and request a proof from the manager
      const [paymentProof, pError] = await worker.requestPaymentProof(
        peerIdFromString(managerPeerId),
        payments.map((p) => p.state),
      );

      if (!paymentProof) {
        throw new Error("payment proof not found");
      }

      //verify that the proof was received
      expect(paymentProof.piA).toBeDefined();

      // lets manipulate the payments and request a proof
      const manipulatedPayments = payments.map((p) => ({
        ...p,
        state: {
          ...p.state,
          amount: p.state.amount + BigInt(1000),
        },
      }));

      //request a proof from the manager
      const [proof, error] = await worker.requestPaymentProof(
        peerIdFromString(managerPeerId),
        manipulatedPayments.map((p) => p.state),
      );

      //expect that we have an error
      expect(error).toBeDefined();
    },
    { timeout: 20000 },
  );
});
