import type { WorkerSyncResponse } from "@effectai/protobufs";

export const runCatchUpSync = async ({
  scopes,
  limit,
  tasksCursor,
  paymentsCursor,
  syncPage,
}: {
  scopes: string[];
  limit?: number;
  tasksCursor?: string;
  paymentsCursor?: string;
  syncPage: (args: {
    scopes: string[];
    limit?: number;
    tasksCursor?: string;
    paymentsCursor?: string;
  }) => Promise<WorkerSyncResponse>;
}) => {
  const remainingScopes = new Set(scopes);
  let nextTasksCursor = tasksCursor;
  let nextPaymentsCursor = paymentsCursor;
  let lastSync: WorkerSyncResponse | null = null;
  let firstPage = true;

  while (remainingScopes.size > 0) {
    const pageScopes: string[] = [];

    if (firstPage) {
      if (remainingScopes.has("status")) pageScopes.push("status");
      if (remainingScopes.has("capabilities")) pageScopes.push("capabilities");
    }
    if (remainingScopes.has("tasks")) pageScopes.push("tasks");
    if (remainingScopes.has("payments")) pageScopes.push("payments");

    if (pageScopes.length === 0) {
      break;
    }

    const sync = await syncPage({
      scopes: pageScopes,
      limit,
      tasksCursor: nextTasksCursor,
      paymentsCursor: nextPaymentsCursor,
    });

    lastSync = sync;
    nextTasksCursor = sync.tasksCursor ?? nextTasksCursor;
    nextPaymentsCursor = sync.paymentsCursor ?? nextPaymentsCursor;

    remainingScopes.delete("status");
    remainingScopes.delete("capabilities");

    if (!sync.tasksHasMore) {
      remainingScopes.delete("tasks");
    }
    if (!sync.paymentsHasMore) {
      remainingScopes.delete("payments");
    }

    firstPage = false;
  }

  return lastSync;
};
