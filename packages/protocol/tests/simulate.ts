import { createManager, createWorker } from "../src/index";
import { peerIdFromString } from "@libp2p/peer-id";
import { performance } from "node:perf_hooks";
import { randomBytes } from "node:crypto";

import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

import { LevelDatastore } from "datastore-level";
import { computeTemplateId } from "../src/core/utils";
import { Template } from "../src/core/messages/effect";

export const createDataStore = async (path: string) => {
  const datastore = new LevelDatastore(path);
  await datastore.open();
  return datastore;
};

export const createDummyTemplate = (providerPeerIdStr: string) => {
  const templateHtml =
    "<html><body><h1>Test Template with test variable: {{test}} </h1></body></html>";
  const templateId = computeTemplateId(providerPeerIdStr, templateHtml);
  const template: Template = {
    templateId,
    data: templateHtml,
    createdAt: Math.floor(Date.now() / 1000),
  };
  return { template, templateId };
};

async function runMultiWorkerTest(numWorkers: number, tasksPerWorker: number) {
  console.log(
    `Starting test with ${numWorkers} workers and ${tasksPerWorker} tasks each...`,
  );
  const startTime = performance.now();

  // 1. Create manager
  const manager = await createManager({
    datastore: await createDataStore("/tmp/manager-stress-test"),
    privateKey: await generateKeyPairFromSeed("Ed25519", randomBytes(32)),
    autoManage: false, // Let manager auto-manage tasks
  });
  await manager.start();

  const managerPeerId = manager.entity.getPeerId();
  const managerMultiAddr = manager.entity.getMultiAddress()?.[0];

  if (!managerMultiAddr) {
    throw new Error("Manager multiaddress is undefined");
  }

  // 2. Register template
  const { template, templateId } = createDummyTemplate(
    managerPeerId.toString(),
  );

  await manager.templateManager.registerTemplate({
    template,
    providerPeerIdStr: managerPeerId.toString(),
  });

  // 3. Create workers
  const workers = await Promise.all(
    Array(numWorkers)
      .fill(0)
      .map(async (_, i) => {
        const worker = await createWorker({
          datastore: await createDataStore(`/tmp/worker-stress-test-${i}`),
          privateKey: await generateKeyPairFromSeed("Ed25519", randomBytes(32)),
          getSessionData: () => ({
            nonce: 0n,
            recipient: `recipient-${i}`,
          }),
        });
        await worker.start();
        await worker.connect(managerMultiAddr);
        return worker;
      }),
  );

  // 4. Create and distribute tasks
  const totalTasks = numWorkers * tasksPerWorker;
  const taskPromises = [];

  for (let i = 0; i < totalTasks; i++) {
    const workerIdx = i % numWorkers; // Round-robin distribution
    const taskId = `task-${i}`;

    const taskPromise = (async () => {
      // Create task
      const task = {
        id: taskId,
        title: `Task ${i}`,
        reward: 100n,
        timeLimitSeconds: 600,
        templateId,
        templateData: '{"test": "value"}',
      };

      await manager.taskManager.createTask({
        task,
        providerPeerIdStr: managerPeerId.toString(),
      });

      // Worker accepts and completes
      await workers[workerIdx].acceptTask({ taskId });
      await workers[workerIdx].completeTask({
        taskId,
        result: `Result ${i}`,
      });

      return true;
    })();

    taskPromises.push(taskPromise);

    // Batch to avoid memory issues
    if (i % 100 === 0) {
      await Promise.all(taskPromises.splice(0, taskPromises.length));
    }
  }

  // Wait for remaining tasks
  await Promise.all(taskPromises);

  // 5. Verification
  const completedTasks = await manager.taskManager.listTasks();
  const completedCount = completedTasks.filter((t) =>
    t.events.some((e) => e.type === "payout"),
  ).length;

  console.log(`Completed ${completedCount}/${totalTasks} tasks`);
  console.log(`Test took ${(performance.now() - startTime) / 1000} seconds`);

  // 6. Cleanup
  await Promise.all(workers.map((w) => w.stop()));
  await manager.stop();
}

// Run with 10 workers, 50 tasks each (500 total tasks)
runMultiWorkerTest(5, 50).catch(console.error);
