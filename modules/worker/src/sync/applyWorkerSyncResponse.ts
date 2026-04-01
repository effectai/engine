import type { Payment, WorkerSyncResponse } from "@effectai/protobufs";
import type { WorkerTaskStore } from "../stores/workerTaskStore.js";
import type { WorkerSyncStateStore } from "../stores/workerSyncStateStore.js";

interface PaymentStoreLike {
  create: (args: { peerId: string; payment: Payment }) => Promise<unknown>;
}

export const applyWorkerSyncResponse = async ({
  sync,
  taskStore,
  paymentStore,
  syncStateStore,
}: {
  sync: WorkerSyncResponse;
  taskStore: Pick<WorkerTaskStore, "upsertFromSync">;
  paymentStore: PaymentStoreLike;
  syncStateStore: Pick<WorkerSyncStateStore, "saveFromSync">;
}) => {
  for (const task of sync.tasks ?? []) {
    if (!task.task) continue;

    await taskStore.upsertFromSync({
      task: task.task,
      status: task.status,
      managerPeerId: sync.managerPeerId,
    });
  }

  for (const payment of sync.payments ?? []) {
    if (!payment.payment) continue;

    await paymentStore.create({
      peerId: sync.managerPeerId,
      payment: payment.payment,
    });
  }

  await syncStateStore.saveFromSync({
    workerId: sync.workerId,
    managerPeerId: sync.managerPeerId,
    cursor: sync.cursor,
    tasksCursor: sync.tasksCursor,
    paymentsCursor: sync.paymentsCursor,
    serverTime: sync.serverTime,
    status: sync.status,
    capabilities: sync.capabilities ?? [],
  });
};
