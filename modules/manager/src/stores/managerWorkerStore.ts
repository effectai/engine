import {
  type Datastore,
  parseWithBigInt,
  createEntityStore,
  stringifyWithBigInt,
  Key,
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
    defaultPrefix: "workers",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const stateKey = (peerId: string) => new Key(`/workers/state/${peerId}`);
  const statusKey = (status: WorkerStatus, peerId: string) =>
    new Key(`/workers/byStatus/${status}/${peerId}`);
  const capabilityKey = (capability: string, peerId: string) =>
    new Key(`/workers/byCapability/${capability}/${peerId}`);

  const allCapabilities = (state: WorkerState) =>
    Array.from(new Set([...state.capabilities, ...state.managerCapabilities]));

  const updateIndexes = async ({
    previous,
    next,
  }: {
    previous: WorkerState | null;
    next: WorkerState;
  }) => {
    const batch = datastore.batch();

    batch.put(stateKey(next.peerId), Buffer.from(stringifyWithBigInt({
      events: [],
      state: next,
    })));

    if (!previous || previous.status !== next.status) {
      if (previous) {
        batch.delete(statusKey(previous.status, next.peerId));
      }
      batch.put(statusKey(next.status, next.peerId), new Uint8Array());
    }

    const previousCaps = previous ? allCapabilities(previous) : [];
    const nextCaps = allCapabilities(next);

    for (const cap of previousCaps) {
      if (!nextCaps.includes(cap)) {
        batch.delete(capabilityKey(cap, next.peerId));
      }
    }

    for (const cap of nextCaps) {
      if (!previousCaps.includes(cap)) {
        batch.put(capabilityKey(cap, next.peerId), new Uint8Array());
      }
    }

    await batch.commit();
  };

  const createWorker = async (
    peerId: string,
    state: Partial<WorkerState> & Pick<WorkerState, "recipient" | "nonce">
  ) => {
    const record = await coreStore.getSafe({ entityId: `state/${peerId}` });

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

    const batch = datastore.batch();
    batch.put(stateKey(peerId), Buffer.from(stringifyWithBigInt(newRecord)));
    batch.put(statusKey(newRecord.state.status, peerId), new Uint8Array());

    for (const cap of allCapabilities(newRecord.state)) {
      batch.put(capabilityKey(cap, peerId), new Uint8Array());
    }

    await batch.commit();

    return newRecord;
  };

  const updateWorker = async (
    peerId: string,
    updater: (current: WorkerRecord["state"]) => Partial<WorkerRecord["state"]>,
  ) => {
    const record = await coreStore.get({ entityId: `state/${peerId}` });
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

    const batch = datastore.batch();
    batch.put(stateKey(peerId), Buffer.from(stringifyWithBigInt(record)));

    if (previous.status !== record.state.status) {
      batch.delete(statusKey(previous.status, peerId));
      batch.put(statusKey(record.state.status, peerId), new Uint8Array());
    }

    const previousCaps = allCapabilities(previous);
    const nextCaps = allCapabilities(record.state);

    for (const cap of previousCaps) {
      if (!nextCaps.includes(cap)) {
        batch.delete(capabilityKey(cap, peerId));
      }
    }

    for (const cap of nextCaps) {
      if (!previousCaps.includes(cap)) {
        batch.put(capabilityKey(cap, peerId), new Uint8Array());
      }
    }

    await batch.commit();
  };

  const getWorkerState = async (peerId: string) =>
    coreStore.getSafe({ entityId: `state/${peerId}` });

  return {
    ...coreStore,
    updateWorker,
    createWorker,
    getWorkerState,
  };
};
