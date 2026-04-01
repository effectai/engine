import {
  type Datastore,
  parseWithBigInt,
  createEntityStore,
  stringifyWithBigInt,
} from "@effectai/protocol-core";

export type WorkerStatus =
  | "disconnected"
  | "connected"
  | "idle"
  | "assigned"
  | "accepted"
  | "submitting"
  | "banned"
  | "maintenance_blocked";

export type ManagerWorkerEvent = WorkerCreated | WorkerJoined | WorkerBanned | WorkerStatusChanged;

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

export interface WorkerStatusChanged {
  timestamp: number;
  type: "status";
  status: WorkerStatus;
}

export interface WorkerState {
  peerId: string;
  recipient: string;
  nonce: bigint;
  lastPayout: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksAccepted: number;
  tasksRejected: number;
  lastActivity: number;
  totalEarned: bigint;
  banned: boolean;
  isAdmin: boolean;
  capabilities: string[];
  managerCapabilities: string[];
  accessCodeRedeemed?: string;
  status: WorkerStatus;
  assignments: string[];
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
    state: Partial<WorkerState> & Pick<WorkerState, "recipient" | "nonce">
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
        peerId,
        recipient: state.recipient,
        banned: false,
        nonce: state.nonce,
        lastPayout: Math.floor(Date.now() / 1000),
        tasksAccepted: 0,
        totalTasks: 0,
        tasksCompleted: 0,
        tasksRejected: 0,
        totalEarned: BigInt(0),
        isAdmin: false,
        accessCodeRedeemed: state.accessCodeRedeemed,
        capabilities: state.capabilities || [],
        managerCapabilities: state.managerCapabilities || [],
        lastActivity: Math.floor(Date.now() / 1000),
        status: state.status || "connected",
        assignments: state.assignments || [],
      },
    };

    await coreStore.put({ entityId: peerId, record: newRecord });

    return newRecord;
  };

  const updateWorker = async (
    peerId: string,
    updater: (current: WorkerRecord["state"]) => Partial<WorkerRecord["state"]>,
  ) => {
    const record = await coreStore.get({ entityId: peerId });
    const previous = structuredClone(record.state);

    const update = updater(record.state);
    Object.assign(record.state, update);

    if (previous.status !== record.state.status) {
      record.events.push({
        timestamp: Math.floor(Date.now() / 1000),
        type: "status",
        status: record.state.status,
      });
    }

    await coreStore.put({ entityId: peerId, record });
  };

  const getWorkerState = async (peerId: string) =>
    coreStore.getSafe({ entityId: peerId });

  return {
    ...coreStore,
    updateWorker,
    createWorker,
    getWorkerState,
  };
};
