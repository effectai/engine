import type { ManagerSettings } from "../main.js";
import {
  type WorkerRecord,
  createWorkerStore,
} from "../stores/managerWorkerStore.js";

import {
  type Datastore,
  EffectProtocolError,
  Key,
  ProtocolError,
} from "@effectai/protocol-core";
import { createAccessCodeStore } from "../stores/managerAccessCodeStore.js";

export type PeerIdStr = string;

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

  const accessCodeStore = createAccessCodeStore({ datastore });

  const generateAccessCode = async () => {
    return await accessCodeStore.create();
  };

  const getAccessCodes = async () => {
    return await accessCodeStore.all();
  };

  const redeemAccessCode = async (peerIdStr: string, accessCode: string) => {
    try {
      await accessCodeStore.redeem(accessCode, peerIdStr);
    } catch (e) {
      throw new EffectProtocolError(
        "400",
        `Failed to redeem access code: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const disconnectWorker = async (peerIdStr: string) => {
    //check if peer is connected
    if (!workerQueue.queue.includes(peerIdStr)) {
      return;
    }

    await workerStore.updateWorker(peerIdStr, () => ({
      lastActivity: Math.floor(Date.now() / 1000),
    }));

    workerQueue.removePeer(peerIdStr);
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
            throw new EffectProtocolError(
              "400",
              "Access code is required to create a new worker",
            );
          }
          await redeemAccessCode(peerId, accessCode);
        }

        await workerStore.createWorker(peerId, {
          nonce,
          recipient,
          accessCodeRedeemed: accessCode,
        });
      } else {
        if (workerRecord.state.banned) {
          throw new ProtocolError("Worker is banned");
        }

        if (!workerRecord.state.accessCodeRedeemed) {
          if (managerSettings.requireAccessCodes) {
            if (!accessCode) {
              throw new Error(
                "Access code is required to connect an existing worker",
              );
            }
            await redeemAccessCode(peerId, accessCode);
          }
        }
      }

      const currentTime = Math.floor(Date.now() / 1000);
      await workerStore.updateWorker(peerId, () => ({
        lastPayout: currentTime,
        lastActivity: currentTime,
      }));

      // add worker to queue
      workerQueue.addPeer({ peerIdStr: peerId });
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  const getWorker = async (peerId: string): Promise<WorkerRecord | null> => {
    const worker = await workerStore.getSafe({ entityId: peerId });

    if (!worker) {
      return null;
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

    await workerStore.updateWorker(peerId, () => ({
      [stateKey]: newValue,
    }));
  };

  const updateWorkerState = workerStore.updateWorker;

  const getWorkers = async (ids: string[]) => {
    const workers = workerStore.getMany({
      keys: ids.map((id) => new Key(`/worker/${id}`)),
    });

    return workers;
  };

  const all = async () => {
    return await workerStore.all();
  };

  return {
    workerStore,
    workerQueue,
    all,
    selectWorker,
    getWorker,
    getWorkers,
    connectWorker,
    disconnectWorker,
    generateAccessCode,
    getAccessCodes,
    updateWorkerState,
    incrementStateValue,
  };
};

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
      }

      return undefined;
    }

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

export type WorkerManager = ReturnType<typeof createWorkerManager>;
