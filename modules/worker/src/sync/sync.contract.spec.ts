import { promises } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDataStore } from "@effectai/test-utils";
import { createPaymentStore, type Datastore } from "../../../../core/protocol/src/index";

import { createWorkerTaskStore } from "../stores/workerTaskStore";
import { createWorkerSyncStateStore } from "../stores/workerSyncStateStore";
import { applyWorkerSyncResponse } from "./applyWorkerSyncResponse";
import { syncContractScenarios } from "./test/syncScenario";

describe("sync contract", () => {
  let datastore: Datastore;

  beforeEach(async () => {
    await promises.rm("/tmp/test/sync-contract", {
      recursive: true,
      force: true,
    });

    datastore = await createDataStore("/tmp/test/sync-contract");
  });

  afterEach(async () => {
    await datastore.close();
  });

  it.each(syncContractScenarios)(
    "applies manager snapshot: $name",
    async (scenario) => {
      const taskStore = createWorkerTaskStore({ datastore });
      const paymentStore = createPaymentStore({ datastore });
      const syncStateStore = createWorkerSyncStateStore({ datastore });

      for (let i = 0; i < scenario.repeatSync; i += 1) {
        await applyWorkerSyncResponse({
          sync: scenario.syncResponse,
          taskStore,
          paymentStore,
          syncStateStore,
        });
      }

      for (const taskId of scenario.expectedActiveTaskIds) {
        const record = await taskStore.get({ entityId: `active/${taskId}` });
        expect(record).toBeDefined();
        expect(record.state.id).toBe(taskId);
      }

      for (const taskId of scenario.expectedCompletedTaskIds) {
        const record = await taskStore.get({ entityId: `completed/${taskId}` });
        expect(record).toBeDefined();
        expect(record.state.id).toBe(taskId);
      }

      const payments = await paymentStore.all({});
      expect(payments).toHaveLength(scenario.expectedPaymentCount);

      const syncState = await syncStateStore.getCurrent();
      expect(syncState).toBeDefined();
      expect(syncState?.state.capabilities).toEqual(
        scenario.syncResponse.capabilities,
      );
      expect(syncState?.state.status?.state).toBe(
        scenario.syncResponse.status?.state,
      );
    },
  );
});
