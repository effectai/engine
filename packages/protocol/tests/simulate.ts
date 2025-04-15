import { createManager, createWorker } from "../dist/index.js";
import { performance } from "node:perf_hooks";
import { randomBytes } from "node:crypto";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { computeTemplateId } from "../dist/core/utils.js";
import { LevelDatastore } from "datastore-level";
import { Template } from "../dist/core/messages/effect.js";
import { Keypair } from "@solana/web3.js";
import { promises } from "node:fs";

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

async function runTaskRateTest(
  workersCount: number,
  tasksPerSecond: number,
  durationSeconds: number,
) {
  console.log(
    `Starting test with ${workersCount} workers at ${tasksPerSecond} tasks/sec for ${durationSeconds}s...`,
  );
  const startTime = performance.now();

  const managerPrivateKey = await generateKeyPairFromSeed(
    "Ed25519",
    randomBytes(32),
  );

  // before we start, make sure to delete the previous datastore
  const path = "/tmp/effect-protocol/rate-tests";
  await promises.rm(path, { recursive: true, force: true });

  // Create manager
  const manager = await createManager({
    datastore: await createDataStore(`${path}/manager`),
    privateKey: managerPrivateKey,
    autoManage: true,
  });

  const managerPeer = manager.entity.getPeerId();
  const managerMulti = manager.entity.getMultiAddress()?.[0];

  if (!managerPeer || !managerMulti) {
    throw new Error("Manager peer or multiaddress not found");
  }

  // Register template
  const { template, templateId } = createDummyTemplate(managerPeer.toString());
  await manager.templateManager.registerTemplate({
    template,
    providerPeerIdStr: managerPeer.toString(),
  });

  // Create the workers for this sim
  const workers = await Promise.all(
    Array(workersCount)
      .fill(0)
      .map(async (_, i) => {
        const randomPrivateKey = await generateKeyPairFromSeed(
          "Ed25519",
          randomBytes(32),
        );

        const workerRecipient = Keypair.generate();

        const worker = await createWorker({
          datastore: await createDataStore(`${path}/worker-${i}`),
          privateKey: randomPrivateKey,
          getSessionData: () => ({
            nonce: 0n,
            recipient: `${workerRecipient.publicKey.toBase58()}`,
          }),
        });

        // Auto-accept and complete tasks
        worker.events.addEventListener("task:created", async ({ detail }) => {
          await worker.acceptTask({ taskId: detail.id });

          //wait a random amount of time before completing the task
          const randomDelay = Math.floor(Math.random() * 1000 * 5);
          await new Promise((resolve) => setTimeout(resolve, randomDelay));

          try {
            await worker.completeTask({
              taskId: detail.id,
              result: `Completed ${detail.id}`,
            });
          } catch (e) {
            console.error(`Error completing task ${detail.id}: ${e}`);
          }

          console.log(
            `Worker ${i} completed task ${detail.id} after ${randomDelay}ms`,
          );
        });

        await worker.start();
        return worker;
      }),
  );

  //connect every worker to the manager
  for (const worker of workers) {
    try {
      await worker.connect(managerMulti);
    } catch (e) {
      console.error(`Error connecting worker: ${e}`);
      return;
    }
  }

  // 4. Task generation by manager
  const tasksIntervalMs = 1000 / tasksPerSecond;
  let tasksCreated = 0;
  const totalTasks = tasksPerSecond * durationSeconds;

  const taskGenerationInterval = setInterval(async () => {
    if (tasksCreated >= totalTasks) {
      clearInterval(taskGenerationInterval);
      return;
    }

    const taskId = `task-${tasksCreated++}`;
    await manager.taskManager.createTask({
      task: {
        id: taskId,
        title: `Rate Test Task ${tasksCreated}`,
        reward: 100n,
        timeLimitSeconds: 4,
        templateId,
        templateData: '{"test": "value"}',
      },
      providerPeerIdStr: managerPeer.toString(),
    });

    if (tasksCreated % 100 === 0) {
      console.log(`Created ${tasksCreated}/${totalTasks} tasks`);
    }
  }, tasksIntervalMs);

  // Wait for all test to be completed
  await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));
  clearInterval(taskGenerationInterval);

  // Fetch & check results
  const completedTasks = await manager.taskManager.getCompletedTasks();
  const completedCount = completedTasks.filter((t) =>
    t.events.some((e) => e.type === "payout"),
  ).length;

  const actualRate = completedCount / durationSeconds;
  console.log(`
    Test completed:
    - Target rate: ${tasksPerSecond} tasks/sec
    - Actual rate: ${actualRate.toFixed(2)} tasks/sec
    - Completion ratio: ${((completedCount / totalTasks) * 100).toFixed(2)}%
    - Duration: ${((performance.now() - startTime) / 1000).toFixed(2)}s
  `);

  // 7. Cleanup workers
  await Promise.all(workers.map((w) => w.stop()));
  await manager.stop();
}

runTaskRateTest(10, 1, 600).catch(console.error);
