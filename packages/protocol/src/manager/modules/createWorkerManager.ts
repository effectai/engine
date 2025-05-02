import { type Datastore, Key } from "interface-datastore";
import {
  createWorkerStore,
  type WorkerRecord,
} from "../stores/managerWorkerStore.js";
import type { ManagerSettings } from "../main.js";
import { managerLogger } from "../../core/logging.js";

export type PeerIdStr = string;

const createWorkerQueue = () => {
  const queue: PeerIdStr[] = [];

  const addPeer = ({ peerIdStr }: { peerIdStr: PeerIdStr }): void => {
    if (!queue.includes(peerIdStr)) {
      queue.push(peerIdStr);
    }
  };

  const dequeuePeer = (workerPeerId?: PeerIdStr): PeerIdStr | undefined => {
    if (queue.length === 0) return undefined;

    if (workerPeerId) {
      const index = queue.findIndex((peer) => peer === workerPeerId);
      if (index !== -1) {
        const worker = queue.splice(index, 1)[0];
        queue.push(worker);
        return worker;
      } else {
        return undefined;
      }
    } else {
      const peer = queue.shift();
      if (peer) queue.push(peer);
      return peer;
    }
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

export const createWorkerManager = ({
  datastore,
  managerSettings,
}: {
  datastore: Datastore;
  managerSettings: ManagerSettings;
}) => {
  const workerQueue = createWorkerQueue();
  const workerStore = createWorkerStore({
    datastore,
  });

  const generateAccessCode = async () => {
    const accessCode = Math.random().toString(36).substring(2, 10);

    const accessCodeData = {
      redeemedBy: null,
      redeemedOn: null,
      createdAt: Date.now(),
    };

    await datastore.put(
      new Key(`access-codes/${accessCode}`),
      Buffer.from(JSON.stringify(accessCodeData)),
    );

    return accessCode;
  };

  const redeemAccessCode = async (peerIdStr: string, accessCode: string) => {
    let result = null;
    try {
      result = await datastore.get(new Key(`access-codes/${accessCode}`));
    } catch (e) {
      throw new Error("Access code not found");
    }

    const accessCodeData = JSON.parse(result.toString());

    if (accessCodeData.redeemedBy) {
      throw new Error("Access code has already been redeemed");
    }

    accessCodeData.redeemedBy = peerIdStr;
    accessCodeData.redeemedOn = Date.now();

    await datastore.put(
      new Key(`access-codes/${accessCode}`),
      Buffer.from(JSON.stringify(accessCodeData)),
    );

    return true;
  };

  const connectWorker = async (
    peerId: string,
    recipient: string,
    nonce: bigint,
    accessCode?: string,
  ) => {
    try {
      // check if the peerId is already in the worker store
      const workerRecord = await workerStore.getSafe({ entityId: peerId });

      if (!workerRecord) {
        if (managerSettings.requireAccessCodes) {
          if (!accessCode) {
            throw new Error("Access code is required to create a new worker");
          }
          await redeemAccessCode(peerId, accessCode);
        }
        await workerStore.createWorker(peerId, recipient, nonce);
        managerLogger.info(`New Worker: ${peerId} created`);
      } else {
        managerLogger.info(`Returning worker ${peerId} connected`);
      }

      //overwrite the recipient
      await workerStore.updateWorker(peerId, {
        recipient,
      });

      // add worker to queue
      workerQueue.addPeer({ peerIdStr: peerId });
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  const getWorker = async (peerId: string) => {
    const worker = await workerStore.get({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    return worker;
  };

  const selectWorker = async (): Promise<string | null> => {
    const queue = workerQueue.getQueue();

    for (const workerId of queue) {
      const worker = await getWorker(workerId);

      if (!worker) {
        continue;
      }

      const busy = await isBusy(worker);

      if (!busy) {
        workerQueue.dequeuePeer(workerId);
        return workerId;
      }
    }

    // No available worker found
    managerLogger.info("No available workers");
    return null;
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

  const incrementStateValue = async (
    peerId: string,
    stateKey: keyof WorkerRecord["state"],
  ) => {
    const worker = await workerStore.getSafe({ entityId: peerId });

    if (!worker) {
      throw new Error("Worker not found");
    }

    const currentValue = worker.state[stateKey];

    let newValue: number | bigint;
    if (typeof currentValue === "bigint") {
      newValue = currentValue + 1n;
    } else if (typeof currentValue === "number") {
      newValue = currentValue + 1;
    } else {
      throw new Error(
        `Cannot increment non-number/bigint field: ${String(stateKey)}`,
      );
    }

    await workerStore.updateWorker(peerId, {
      [stateKey]: newValue,
    });
  };

  const updateWorkerState = async (
    peerId: string,
    update: Partial<WorkerRecord["state"]>,
  ) => {
    await workerStore.updateWorker(peerId, update);
  };

  const getWorkers = async (ids: string[]) => {
    const workers = workerStore.getMany({
      keys: ids.map((id) => new Key(`/worker/${id}`)),
    });

    return workers;
  };

  return {
    selectWorker,
    getWorker,
    getWorkers,
    connectWorker,
    workerStore,
    workerQueue,
    generateAccessCode,
    updateWorkerState,
    incrementStateValue,
  };
};
