import { describe, it } from "vitest";
import {
  createManagerNode,
  createWorkerNode,
  TaskStatus,
  type Task,
} from "./../src/index.js";

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
                `Task completed by ${peer.peerId.toString()}`
              );
            }
          }
        }

        //wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const tasks = await manager1.services.taskStore.all();
        console.log(tasks);
      },
      { timeout: 20000 }
    );
  });
});
