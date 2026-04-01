import type { Payment, Task, WorkerSyncResponse } from "@effectai/protobufs";

export const WORKER_PEER_ID = "12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5";
export const MANAGER_PEER_ID = "12D3KooWQ7mA7rM8ar1W5NPHm2m5WjQmLxY6V9QJ4T8w2n3X1Y7z";
const IDs = {
  taskActive: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  taskCompleted: "01ARZ3NDEKTSV4RRFFQ69G5FAW",
  payment: "01ARZ3NDEKTSV4RRFFQ69G5FAX",
};

export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: IDs.taskActive,
  title: "sync task",
  reward: 100n,
  timeLimitSeconds: 600,
  templateId: "template-1",
  templateData: JSON.stringify({ prompt: "hello" }),
  capability: "model/gpt5",
  ...overrides,
});

export const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: IDs.payment,
  version: 1,
  amount: 25n,
  recipient: "recipient-1",
  paymentAccount: "payment-account-1",
  nonce: 1n,
  publicKey: "manager-public-key",
  signature: {
    R8: {
      R8_1: "1",
      R8_2: "2",
    },
    S: "3",
  },
  ...overrides,
});

export interface SyncScenario {
  name: string;
  syncResponse: WorkerSyncResponse;
  repeatSync: number;
  expectedActiveTaskIds: string[];
  expectedCompletedTaskIds: string[];
  expectedPaymentCount: number;
}

const activeTask = makeTask({ id: IDs.taskActive });
const completedTask = makeTask({ id: IDs.taskCompleted });
const payment = makePayment({ nonce: 3n });

export const syncContractScenarios: SyncScenario[] = [
  {
    name: "full_sync_first_connect",
    syncResponse: {
      serverTime: Math.floor(Date.now() / 1000),
      workerId: WORKER_PEER_ID,
      cursor: 42n,
      managerPeerId: MANAGER_PEER_ID,
      status: {
        state: "idle",
        lastActivity: Math.floor(Date.now() / 1000),
      },
      capabilities: ["model/gpt5", "vision/ocr"],
      tasks: [
        {
          taskId: activeTask.id,
          status: "assigned",
          lastEventAt: Math.floor(Date.now() / 1000),
          task: activeTask,
        },
        {
          taskId: completedTask.id,
          status: "completed",
          lastEventAt: Math.floor(Date.now() / 1000),
          task: completedTask,
        },
      ],
      payments: [
        {
          paymentId: payment.id,
          status: "created",
          amount: payment.amount.toString(),
          createdAt: Math.floor(Date.now() / 1000),
          payment,
        },
      ],
    },
    repeatSync: 2,
    expectedActiveTaskIds: [activeTask.id],
    expectedCompletedTaskIds: [completedTask.id],
    expectedPaymentCount: 1,
  },
];
