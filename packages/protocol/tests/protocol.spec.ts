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
  waitForTaskEvent,
} from "./utils.js";
import { randomBytes } from "node:crypto";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import type { Task, Template } from "../src/core/messages/effect.js";
import type { WorkerTaskRecord } from "../src/worker/stores/workerTaskStore.js";

import { promises } from "node:fs";
import { Keypair } from "@solana/web3.js";

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
    await promises.rm("/tmp/worker-test", { recursive: true, force: true });
    await promises.rm("/tmp/manager-test/", {
      recursive: true,
      force: true,
    });

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
      settings: {
        listen: ["/ip4/0.0.0.0/tcp/0/ws"],
        autoManage: false,
        requireAccessCodes: false,
        paymentBatchSize: 60,
      },
    });

    worker = await createWorker({
      datastore: workerDatastore,
      privateKey: workerPrivateKey,
      autoExpire: false,
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

    //generate public key
    const kp = Keypair.generate();
    await worker.connect(managerMultiAddress[0], kp.publicKey.toBase58(), 1n);
    // wait for the nodes to be ready
    await delay(2000);
  });

  afterEach(async () => {
    await manager.stop();
    await worker.stop();

    //close the datastores
    await managerDatastore.close();
    await workerDatastore.close();
  });

  it(
    "should complete the happy-path of the task flow",
    async () => {
      const { template, templateId } = createDummyTemplate(
        providerPeerId.toString(),
      );

      // register template
      await manager.taskManager.registerTemplate({
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

      await manager.taskManager.manageTask(taskRecord);

      //verify that worker received task assignment
      await waitForTaskEvent(testTask.id, workerEvents.filtered.taskCreated);
      expect(workerEvents.taskCreated).toHaveBeenCalled();

      //get task from worker store and let worker accept it.
      workerTaskRecord = await worker.getTask({ taskId: testTask.id });
      await worker.acceptTask({
        taskId: testTask.id,
      });

      //verify that manager registered the accept
      await waitForTaskEvent(testTask.id, managerEvents.filtered.taskAccepted);
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
      await waitForTaskEvent(
        testTask.id,
        managerEvents.filtered.taskSubmission,
      );
      expect(managerEvents.taskSubmission).toHaveBeenCalled();

      //Manager processes task completion and payout
      const managerTaskRecord = await manager.taskManager.getTask({
        taskId: testTask.id,
      });
      await manager.taskManager.manageTask(managerTaskRecord);

      //verify that worker recieved payment
      expect(workerEvents.paymentReceived).toHaveBeenCalled();

      //verify the final state of the completed task in the manager store.
      const completedTask = await manager.taskManager.getTask({
        taskId: testTask.id,
        index: "completed",
      });

      expect(completedTask.events).toEqual([
        expect.objectContaining({ type: "create" }),
        expect.objectContaining({ type: "assign" }),
        expect.objectContaining({ type: "accept" }),
        expect.objectContaining({ type: "submission" }),
        expect.objectContaining({ type: "payout" }),
      ]);
    },
    {
      timeout: 20000,
    },
  );

  it(
    "requests a template from the manager",
    async () => {
      const workerEvents = trackWorkerEvents(worker);

      const { template, templateId } = createDummyTemplate(
        providerPeerId.toString(),
      );

      await manager.taskManager.registerTemplate({
        providerPeerIdStr: providerPeerId.toString(),
        template,
      });

      const testTask: Task = {
        id: "task-1",
        title: "Test Task",
        reward: 100n,
        timeLimitSeconds: 600,
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
      await manager.taskManager.manageTask(taskRecord);

      //verify that worker received task assignment
      await waitForTaskEvent(
        taskRecord.state.id,
        workerEvents.filtered.taskCreated,
      );

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
    },
    {
      timeout: 20000,
    },
  );

  it(
    "should correctly handle payout flow",
    async () => {
      const workerEvents = trackWorkerEvents(worker);

      //lets request n payouts from manager
      const n = 2;
      for (let i = 0; i < n; i++) {
        await worker.requestPayout({
          managerPeerIdStr: managerPeerId,
        });
      }

      //verify that manager processed payout request
      expect(workerEvents.paymentReceived).toHaveBeenCalledTimes(n);

      //verify that we have n payments in our store
      const payments = await worker.getPayments({});
      expect(payments.length).toBe(n);

      //lets batch these payments and request a proof from the manager
      const [paymentProof, pError] = await worker.requestPaymentProof(
        managerPeerId,
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
        managerPeerId,
        manipulatedPayments.map((p) => p.state),
      );

      //expect that we have an error
      expect(error).toBeDefined();
    },
    { timeout: 20000 },
  );

  const concurrentTasks = 10;
  it(`should handle ${concurrentTasks} concurrent tasks`, async () => {
    const { template, templateId } = createDummyTemplate(
      providerPeerId.toString(),
    );

    const workerEvents = trackWorkerEvents(worker);
    const managerEvents = trackManagerEvents(manager);

    await manager.taskManager.registerTemplate({
      template,
      providerPeerIdStr: providerPeerId.toString(),
    });

    const tasks = Array(concurrentTasks)
      .fill(0)
      .map((_, i) => ({
        id: `concurrent-task-${i}`,
        title: `Concurrent Task ${i}`,
        reward: 100n,
        timeLimitSeconds: 600,
        templateId,
        templateData: '{"test": "value"}',
      }));

    // Create, assign, and complete all tasks concurrently
    await Promise.all(
      tasks.map((task) =>
        manager.taskManager
          .createTask({ task, providerPeerIdStr: providerPeerId.toString() })
          .then(async (record) => {
            await manager.taskManager.manageTask(record);
            await waitForTaskEvent(task.id, workerEvents.filtered.taskCreated);

            worker.acceptTask({ taskId: task.id });
            await waitForTaskEvent(task.id, workerEvents.filtered.taskAccepted);

            worker.completeTask({ taskId: task.id, result: "done" });
            await waitForTaskEvent(
              task.id,
              managerEvents.filtered.taskSubmission,
            );

            //fetch the task record from the manager
            const managerTask = await manager.taskManager.getTask({
              taskId: task.id,
              index: "active",
            });

            // let manager manage the task again
            await manager.taskManager.manageTask(managerTask);

            //expect task to be marked as completed
            await waitForTaskEvent(
              task.id,
              managerEvents.filtered.taskCompleted,
            );

            return true;
          }),
      ),
    );

    // Verify all tasks completed
    const completed = await manager.taskManager.getCompletedTasks();
    expect(
      completed.filter((t) => t.events.some((e) => e.type === "payout")).length,
    ).toBe(concurrentTasks);
  });
});
