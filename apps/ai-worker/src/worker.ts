import { createWorker, Task } from "@effectai/protocol";
import type { Connection } from "@libp2p/interface";

import { state } from "./state.js";

// TODO: move to utils or something
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Execute a task via the configured backend and submit the result.
 */
const processTask = async (t: Task): Promise<boolean> => {
  try {
    const result = await state.backend?.execute(t);
    await state.worker.completeTask({
      taskId: t.id,
      result: String(result ?? ""),
    });
  } catch (e) {
    console.error(`Error completing task ${t.id}: ${e}`);
    return false;
  }

  return true;
};

const completePendingTasks = async () => {
  let tasks = await state.worker.getTasks({});

  let pendingTasks = tasks.filter(
    (t) =>
      t.events.find((e) => e.type === "accept") &&
      t.events.find((e) => e.type === "expire") === undefined &&
      t.events.find((e) => e.type === "complete") === undefined,
  );

  console.log(pendingTasks.map((e) => e.events));
  console.log(`
${tasks.length} tasks in store
${pendingTasks.length} pending
`);

  if (pendingTasks.length > 0) {
    console.log(pendingTasks[0]);
    await state.worker.completeTask({
      taskId: pendingTasks[0].state.id,
      result: `Completed`,
    });
  }
};

export const create = async (): ReturnType<typeof createWorker> => {
  const { datastore, privateKey } = state;
  const w = await createWorker({ datastore, privateKey, autoExpire: false });
  state.worker = w;

  const libp2p = w.entity.node;

  libp2p.addEventListener("peer:connect", (event: Event) => {
    console.log("Peer connected:", event);
    console.log(
      "List of all peers:",
      libp2p.getConnections().map((c: Connection) => c.id),
    );
  });

  w.events.addEventListener("task:created", async ({ detail }) => {
    if (state.activeTask) {
      console.log("Skipping task, already have one", state.activeTask.title);
      return;
    }

    if (!state.backend?.isReady()) {
      console.log("Skipping task, backend not ready", detail.id);
      state.activeTask = undefined;
      return;
    }

    state.activeTask = detail;

    await state.worker.acceptTask({ taskId: detail.id });
    console.log("Accepted Task", detail.id);

    await delay(Math.floor(Math.random() * 1000 * 5));
    await processTask(detail);

    console.log(`Completed task ${detail.id}`);

    state.activeTask = undefined;
  });

  return w;
};
