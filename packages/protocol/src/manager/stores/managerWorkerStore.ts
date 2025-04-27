import { Key, type Datastore } from "interface-datastore";
import { createEntityStore } from "../../core/store.js";
import { parseWithBigInt, stringifyWithBigInt } from "../../core/utils.js";

export type ManagerWorkerEvent = WorkerCreated | WorkerJoined | WorkerBanned;

export interface WorkerCreated {
  timestamp: number;
  type: "create";
}

export interface WorkerJoined {
  timestamp: number;
  type: "join";
}

export interface WorkerBanned {
  timestamp: number;
  type: "ban";
  reason: string;
}

export interface WorkerState {
  banned: boolean;
  recipient: string;
  nonce: bigint;
  lastPayout: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksAccepted: number;
  tasksRejected: number;
  lastActivity: number;
}

export interface ManagerWorkerRecord<T> {
  events: T[];
  state: WorkerState;
}

export type WorkerRecord = ManagerWorkerRecord<ManagerWorkerEvent>;

export const createWorkerStore = ({ datastore }: { datastore: Datastore }) => {
  const coreStore = createEntityStore<
    ManagerWorkerEvent,
    ManagerWorkerRecord<ManagerWorkerEvent>
  >({
    datastore,
    defaultPrefix: "worker",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const createWorker = async (
    peerId: string,
    recipient: string,
    nonce: bigint,
  ) => {
    const record = await coreStore.getSafe({ entityId: peerId });

    if (record) {
      throw new Error("Worker already exists");
    }

    const newRecord: WorkerRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
        },
      ],
      state: {
        recipient,
        banned: false,
        nonce,
        lastPayout: Math.floor(Date.now() / 1000),
        tasksAccepted: 0,
        totalTasks: 0,
        tasksCompleted: 0,
        tasksRejected: 0,
        lastActivity: Math.floor(Date.now() / 1000),
      },
    };

    await coreStore.put({ entityId: peerId, record: newRecord });

    return newRecord;
  };

  const updateWorker = async (peerId: string, update: Partial<WorkerState>) => {
    const record = await coreStore.getSafe({ entityId: peerId });

    if (!record) {
      throw new Error("Worker not found");
    }

    Object.assign(record.state, update);

    await coreStore.put({ entityId: peerId, record });
  };

  return {
    ...coreStore,
    updateWorker,
    createWorker,
  };
};
