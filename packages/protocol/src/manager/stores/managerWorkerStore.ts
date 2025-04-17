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

export const createWorkerStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<
    ManagerWorkerEvent,
    ManagerWorkerRecord<ManagerWorkerEvent>
  >({
    datastore,
    defaultPrefix: "worker",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  return {
    ...coreStore,
  };
};
