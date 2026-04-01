import {
  type Datastore,
  createEntityStore,
  parseWithBigInt,
  stringifyWithBigInt,
} from "@effectai/protocol-core";
import type { WorkerSyncStatus } from "@effectai/protobufs";

interface WorkerSyncStateUpdatedEvent {
  type: "sync_state_updated";
  timestamp: number;
}

export interface WorkerSyncStateRecord {
  events: WorkerSyncStateUpdatedEvent[];
  state: {
    workerId: string;
    managerPeerId: string;
    cursor: bigint;
    serverTime: number;
    status?: WorkerSyncStatus;
    capabilities: string[];
    updatedAt: number;
  };
}

export const createWorkerSyncStateStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<
    WorkerSyncStateUpdatedEvent,
    WorkerSyncStateRecord
  >({
    datastore,
    defaultPrefix: "workerSyncState",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const syncEntityId = "current";

  const saveFromSync = async ({
    workerId,
    managerPeerId,
    cursor,
    serverTime,
    status,
    capabilities,
  }: Omit<WorkerSyncStateRecord["state"], "updatedAt">) => {
    const existing = await coreStore.getSafe({ entityId: syncEntityId });
    const timestamp = Math.floor(Date.now() / 1000);

    const record: WorkerSyncStateRecord = {
      events: [
        ...(existing?.events ?? []),
        {
          type: "sync_state_updated",
          timestamp,
        },
      ],
      state: {
        workerId,
        managerPeerId,
        cursor,
        serverTime,
        status,
        capabilities,
        updatedAt: timestamp,
      },
    };

    await coreStore.put({
      entityId: syncEntityId,
      record,
    });

    return record;
  };

  const getCurrent = async () => {
    return await coreStore.getSafe({ entityId: syncEntityId });
  };

  return {
    ...coreStore,
    saveFromSync,
    getCurrent,
  };
};

export type WorkerSyncStateStore = ReturnType<typeof createWorkerSyncStateStore>;
