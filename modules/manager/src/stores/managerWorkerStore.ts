import {
  type Datastore,
  parseWithBigInt,
  createEntityStore,
  stringifyWithBigInt,
} from "@effectai/protocol-core";

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
  discordName?: string;
}

export interface ManagerWorkerRecord<T> {
  events: T[];
  state: WorkerState;
}

export type WorkerRecord = ManagerWorkerRecord<ManagerWorkerEvent>;

/**
 * parseWithBigInt revives any "<digits>n" string as a bigint, so free text like
 * a Discord name of "123n" or a generated access code of "1234567n" comes back
 * as a bigint and crashes consumers expecting a string. None of these fields is
 * ever legitimately a bigint, so appending the "n" back restores the text.
 */
const TEXT_STATE_FIELDS = ["discordName", "accessCodeRedeemed"] as const;

const recoverTextFields = (record: WorkerRecord): WorkerRecord => {
  for (const field of TEXT_STATE_FIELDS)
    if (typeof record?.state?.[field] === "bigint")
      record.state[field] = `${record.state[field]}n`;

  return record;
};

export const createWorkerStore = ({ datastore }: { datastore: Datastore }) => {
  const coreStore = createEntityStore<
    ManagerWorkerEvent,
    ManagerWorkerRecord<ManagerWorkerEvent>
  >({
    datastore,
    defaultPrefix: "worker",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => recoverTextFields(parseWithBigInt(data)),
  });

  const createWorker = async (
    peerId: string,
    state: Partial<WorkerState> & Pick<WorkerState, "recipient" | "nonce">,
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
        managerCapabilities: [],
        lastActivity: Math.floor(Date.now() / 1000),
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

    const update = updater(record.state);
    Object.assign(record.state, update);

    await coreStore.put({ entityId: peerId, record });
  };

  return {
    ...coreStore,
    updateWorker,
    createWorker,
  };
};
