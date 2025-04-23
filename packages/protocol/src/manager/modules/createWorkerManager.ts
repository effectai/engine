import { Datastore } from "interface-datastore";
import {
  createWorkerStore,
  ManagerWorkerRecord,
  WorkerRecord,
} from "../stores/managerWorkerStore.js";
import { ManagerEntity } from "../main.js";
import { managerLogger } from "../../core/logging.js";
import { stringifyWithBigInt } from "../../core/utils.js";

export type PeerIdStr = string;

export const createWorkerManager = ({
  datastore,
  manager,
}: { datastore: Datastore; manager: ManagerEntity }) => {
  const createWorkerQueue = () => {
    const queue: PeerIdStr[] = [];

    const addPeer = ({
      peerIdStr,
    }: {
      peerIdStr: PeerIdStr;
    }): void => {
      if (!queue.includes(peerIdStr)) {
        queue.push(peerIdStr);
      }
    };

    const dequeuePeer = (): PeerIdStr | undefined => {
      if (queue.length === 0) return undefined;
      const peer = queue.shift();
      if (peer) queue.push(peer);
      return peer;
    };

    const removePeer = (peerIdStr: PeerIdStr): void => {
      const index = queue.indexOf(peerIdStr);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    };

    const getQueue = (): PeerIdStr[] => {
      return [...queue];
    };

    return {
      queue,
      addPeer,
      dequeuePeer,
      removePeer,
      getQueue,
    };
  };

  const workerQueue = createWorkerQueue();

  const workerStore = createWorkerStore({
    datastore,
  });

  const connectWorker = async (
    peerId: string,
    recipient: string,
    nonce: bigint,
  ) => {
    try {
      // check if the peerId is already in the worker store
      const workerRecord = await workerStore.getSafe({ entityId: peerId });

      if (!workerRecord) {
        // if not, add it
        const newWorkerRecord: WorkerRecord = {
          events: [
            {
              timestamp: Math.floor(Date.now() / 1000),
              type: "create",
            },
          ],
          state: {
            recipient,
            nonce,
            lastPayout: Math.floor(Date.now() / 1000),
            tasksAccepted: 0,
            totalTasks: 0,
            tasksCompleted: 0,
            tasksRejected: 0,
            lastActivity: Math.floor(Date.now() / 1000),
          },
        };

        await workerStore.put({
          entityId: peerId.toString(),
          record: newWorkerRecord,
        });

        managerLogger.info(`New Worker: ${peerId} created`);
      } else {
        managerLogger.info(`Returning worker ${peerId} connected`);
      }

      // add worker to queue
      workerQueue.addPeer({ peerIdStr: peerId });
    } catch (e) {
      console.log(e);
    }
  };

  const incrementTasksAccepted = async (peerId: string) => {
    const worker = await workerStore.get({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    worker.state.tasksAccepted += 1;

    await workerStore.put({
      entityId: peerId,
      record: worker,
    });
  };

  const incrementTasksCompleted = async (peerId: string) => {
    const worker = await workerStore.get({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    worker.state.tasksCompleted += 1;

    await workerStore.put({
      entityId: peerId,
      record: worker,
    });
  };

  const incrementTasksRejected = async (peerId: string) => {
    const worker = await workerStore.get({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    worker.state.tasksRejected += 1;

    await workerStore.put({
      entityId: peerId,
      record: worker,
    });
  };

  const incrementTotalTasks = async (peerId: string) => {
    const worker = await workerStore.get({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    worker.state.totalTasks += 1;

    await workerStore.put({
      entityId: peerId,
      record: worker,
    });
  };

  const getWorker = async (peerId: string) => {
    const worker = await workerStore.get({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    return worker;
  };

  const selectWorker = async (n: number) => {
    //select next worker from the queue that is not busy
    const workerId = workerQueue.getQueue()[n];

    if (!workerId) {
      managerLogger.info("No available workers");
      return null;
    }

    const worker = await getWorker(workerId);

    if (!worker) {
      throw new Error("Worker not found");
    }

    //
    // if (await isBusy(worker)) {
    //   return selectWorker(n + 1);
    // }

    //remove worker from queue
    workerQueue.dequeuePeer();

    return workerId;
  };

  const isBusy = async (workerRecord: WorkerRecord) => {
    // check if worker is busy (i.e. has more than 3 tasks in assigned / accepted)
    return (
      workerRecord.state.totalTasks -
      (workerRecord.state.tasksCompleted +
        workerRecord.state.tasksRejected) >=
      3
    );
  };

  const incrementNonce = async (peerId: string) => {
    const worker = await getWorker(peerId);

    if (!worker) {
      throw new Error("Worker not found");
    }

    worker.state.nonce += 1n;

    await workerStore.put({
      entityId: peerId,
      record: worker,
    });
  };

  const updateLastPayout = async (peerId: string) => {
    const worker = await getWorker(peerId);

    if (!worker) {
      throw new Error("Worker not found");
    }

    worker.state.lastPayout = Math.floor(Date.now() / 1000);

    await workerStore.put({
      entityId: peerId,
      record: worker,
    });
  };

  return {
    selectWorker,
    getWorker,
    connectWorker,
    workerStore,
    workerQueue,

    updateLastPayout,
    incrementNonce,
    incrementTasksAccepted,
    incrementTasksCompleted,
    incrementTasksRejected,
    incrementTotalTasks,
  };
};
