import { createWorker, type Task } from "@effectai/protocol";
import { multiaddr } from "@multiformats/multiaddr";
import { Keypair } from "@solana/web3.js";
import { state } from "./state.js";

export type WorkerRuntimeConfig = {
  manager: string;
  capability: string[];
  accessCode?: string;
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const processTask = async (task: Task): Promise<boolean> => {
  try {
    let template: string | undefined;
    try {
      const taskRecord = await state.worker?.getTask({ taskId: task.id });
      if (taskRecord) {
        template = await state.worker?.renderTask({ taskRecord });
      }
    } catch {
      // template fetch is optional; proceed without it
    }

    const result = await state.backend?.execute(task, template);
    await state.worker?.completeTask({
      taskId: task.id,
      result: String(result ?? ""),
    });
  } catch (e) {
    state.logger.error(`Error completing task ${task.id}`, { error: e });
    return false;
  }

  return true;
};

const createProtocolWorker = async (): ReturnType<typeof createWorker> => {
  const { datastore, privateKey } = state;
  if (!datastore || !privateKey) {
    throw new Error("Worker datastore and private key must be initialized");
  }

  const worker = await createWorker({ datastore, privateKey, autoExpire: false });
  state.worker = worker;

  const libp2p = worker.entity.node;

  libp2p.addEventListener("peer:connect", () => {
    state.logger.info("Peer connected");
    state.logger.info("List of all peers", {
      peers: libp2p.getConnections().map((c) => c.id),
    });
  });

  worker.events.addEventListener("task:created", async ({ detail }) => {
    state.logger.debug("Received and queued new task ", { taskId: detail.id });

    // if we are not processing a task, optimistically trigger
    // processing so we don't have to wait for the cron trigger.
    if (!state.activeTask) {
      await processNextTask();
    }
  });

  return worker;
};

export const processNextTask = async() => {
  if (state.activeTask) {
    state.logger.debug("Ignoring next task, already have one", {
      title: state.activeTask.title,
    });
    return;
  }

  if (!state.backend?.isReady()) {
    state.logger.debug("Backend not ready");
    return;
  }

  // cleanup (from the worker module) removes any expired tasks from
  // the database
  if (!state.worker) return;
  await state.worker.cleanup();
  const tasks = await state.worker.getTasks({});
  const task = tasks?.[0].state;
  if (!task) return;

  state.activeTask = task;

  await state.worker.acceptTask({ taskId: task.id });
  state.logger.info("Accepted task", { taskId: task.id });

  // await delay(Math.floor(Math.random() * 1000 * 5));
  // await processTask(detail);

  // state.logger.info("Completed task", { taskId: detail.id });

  // state.activeTask = undefined;  
};

export const startWorker = async ({
  manager,
  capability,
  accessCode,
}: WorkerRuntimeConfig): Promise<void> => {
  const secretKey = state.solanaSecretKey;
  if (!secretKey) {
    throw new Error("Solana secret key must be initialized");
  }

  state.logger.info("Initializing p2p");
  const worker = await createProtocolWorker();
  await worker.start();

  state.logger.info("Connecting to manager", { manager });
  const workerRecipient = Keypair.fromSecretKey(secretKey, {
    skipValidation: true,
  });

  try {
    await worker.connect(multiaddr(manager), {
      recipient: workerRecipient.publicKey.toBase58(),
      nonce: 1n,
      accessCode,
      capabilities: capability,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes("access code")) {
      throw new Error("Access code rejected. Request a new one from " +
	"https://worker.effect.ai/ and restart with --access-code <code>.");
    }
    throw e;
  }

  state.logger.info("Connected to network");
  state.logger.info("Initializing backend", { backend: state.backend?.id });
  await state.backend?.init();
  state.logger.info("Worker running");

  while (!state.done) {
    await delay(5_000);
    await processNextTask();
  }
};

export const stopWorker = async (): Promise<void> => {
  state.logger.info("Stopping worker");
  await state.worker?.stop();
  state.logger.info("Done");
};
