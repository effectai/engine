import { PublicKey } from "@solana/web3.js";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import type { ManagerEntity, ManagerEvents, ManagerSettings } from "../main.js";
import type { createPaymentManager } from "./createPaymentManager.js";
import type {
  ManagerTaskRecord,
  ManagerTaskStore,
  TaskAcceptedEvent,
  TaskAssignedEvent,
  TaskSubmissionEvent,
} from "../stores/managerTaskStore.js";

import type { createWorkerManager } from "./createWorkerManager.js";
import { computeTemplateId } from "../utils.js";

import {
  type TypedEventEmitter,
  type TemplateStore,
  type Task,
  type Template,
  peerIdFromString,
  parseWithBigInt,
} from "@effectai/protocol-core";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function createTaskManager({
  manager,

  paymentManager,
  workerManager,

  events,

  taskStore,
  templateStore,
  managerSettings,
}: {
  manager: ManagerEntity;
  paymentManager: Awaited<ReturnType<typeof createPaymentManager>>;
  workerManager: ReturnType<typeof createWorkerManager>;

  events: TypedEventEmitter<ManagerEvents>;

  taskStore: ManagerTaskStore;
  templateStore: TemplateStore;

  managerSettings: ManagerSettings;
}) {
  const isExpired = (timestamp: number, value: number) =>
    timestamp + value < Math.floor(Date.now() / 1000);

  const getTask = async ({
    taskId,
    index = "active",
  }: {
    taskId: string;
    index?: string;
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await taskStore.get({
      entityId: `${index}/${taskId}`,
    });

    if (!taskRecord) {
      throw new Error("Task not found");
    }

    return taskRecord;
  };

  const createTask = async ({
    task,
    providerPeerIdStr,
  }: {
    task: Task;
    providerPeerIdStr: string;
  }) => {
    //TODO:: use zod here to validate the task.
    //we must have the templateId in our template store.
    const templateRecord = await templateStore.get({
      entityId: task.templateId,
    });

    if (!templateRecord) {
      throw new Error("Template not found in store");
    }

    const taskRecord = await taskStore.create({
      task,
      providerPeerIdStr,
    });

    events.safeDispatchEvent("task:created", {
      detail: taskRecord,
    });

    return taskRecord;
  };

  const processTaskAcception = async ({
    taskId,
    workerPeerIdStr,
  }: {
    taskId: string;
    workerPeerIdStr: string;
  }) => {
    const taskRecord = await taskStore.accept({
      entityId: taskId,
      peerIdStr: workerPeerIdStr,
    });

    await workerManager.incrementStateValue(workerPeerIdStr, "tasksAccepted");

    events.safeDispatchEvent("task:accepted", {
      detail: taskRecord,
    });
  };

  const processTaskRejection = async ({
    taskId,
    workerPeerIdStr,
    reason,
  }: {
    taskId: string;
    workerPeerIdStr: string;
    reason: string;
  }) => {
    const taskRecord = await taskStore.reject({
      entityId: taskId,
      peerIdStr: workerPeerIdStr,
      reason,
    });

    await workerManager.incrementStateValue(workerPeerIdStr, "tasksRejected");

    events.safeDispatchEvent("task:rejected", {
      detail: taskRecord,
    });
  };

  const processTaskSubmission = async ({
    taskId,
    result,
    workerPeerIdStr,
  }: {
    taskId: string;
    result: string;
    workerPeerIdStr: string;
  }) => {
    const taskRecord = await taskStore.complete({
      entityId: taskId,
      result,
      peerIdStr: workerPeerIdStr,
    });

    await workerManager.incrementStateValue(workerPeerIdStr, "tasksCompleted");

    events.safeDispatchEvent("task:submission", {
      detail: taskRecord,
    });
  };

  const handleCreateEvent = async (taskRecord: ManagerTaskRecord) => {
    await assignTask({ entityId: taskRecord.state.id });
  };

  const handleAssignEvent = async (
    taskRecord: ManagerTaskRecord,
    lastEvent: TaskAssignedEvent,
  ) => {
    if (isExpired(lastEvent.timestamp, TASK_ACCEPTANCE_TIME)) {
      await rejectAndReassignTask(taskRecord);
    }
  };

  const rejectAndReassignTask = async (taskRecord: ManagerTaskRecord) => {
    const latestAssignEvent = taskRecord.events.reduce(
      (latest: TaskAssignedEvent | null, current) => {
        if (current.type === "assign") {
          if (!latest || current.timestamp > latest.timestamp) {
            return current;
          }
        }
        return latest;
      },
      null,
    );

    if (!latestAssignEvent) {
      return;
    }

    await taskStore.reject({
      entityId: taskRecord.state.id,
      peerIdStr: latestAssignEvent.assignedToPeer,
      reason: "Worker took too long to accept/reject task",
    });

    await workerManager.incrementStateValue(
      latestAssignEvent.assignedToPeer,
      "tasksRejected",
    );

    //re-assign the task to another worker.
    await assignTask({ entityId: taskRecord.state.id });
  };

  const handleAcceptEvent = async (
    taskRecord: ManagerTaskRecord,
    lastEvent: TaskAcceptedEvent,
  ) => {
    if (isExpired(lastEvent.timestamp, taskRecord.state.timeLimitSeconds)) {
      await rejectAndReassignTask(taskRecord);
    }
  };

  const handleSubmissionEvent = async (
    taskRecord: ManagerTaskRecord,
    event: TaskSubmissionEvent,
  ) => {
    if (!managerSettings.paymentAccount) {
      throw new Error("Payment account not set, cannot process payout");
    }

    const payment = await paymentManager.generatePayment({
      peerId: peerIdFromString(event.submissionByPeer),
      amount: taskRecord.state.reward,
      paymentAccount: new PublicKey(managerSettings.paymentAccount),
      label: `Payment for task: ${taskRecord.state.id}`,
    });

    await taskStore.payout({
      entityId: taskRecord.state.id,
      payment,
    });

    //send the payment.
    const [ack, error] = await manager.sendMessage(
      peerIdFromString(event.submissionByPeer),
      { payment },
    );

    //update state
    await workerManager.updateWorkerState(event.submissionByPeer, (state) => ({
      totalEarned: state.totalEarned + BigInt(taskRecord.state.reward),
    }));

    //sendout task completed event
    events.safeDispatchEvent("task:completed", { detail: taskRecord });

    return {
      ack,
      error,
    };
  };

  const handleRejectEvent = async (taskRecord: ManagerTaskRecord) => {
    //this task got rejected, lets just re-assign it for now.
    await assignTask({ entityId: taskRecord.state.id });
  };

  const manageTask = async (taskRecord: ManagerTaskRecord) => {
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (!lastEvent) {
      return;
    }

    switch (lastEvent.type) {
      case "create":
        await handleCreateEvent(taskRecord);
        break;
      case "assign":
        await handleAssignEvent(taskRecord, lastEvent);
        break;
      case "accept":
        await handleAcceptEvent(taskRecord, lastEvent);
        break;
      case "reject":
        await handleRejectEvent(taskRecord);
        break;
      case "submission":
        await handleSubmissionEvent(taskRecord, lastEvent);
        break;
      case "payout":
        // do nothing..
        break;
      default:
    }
  };

  const assignTask = async ({ entityId }: { entityId: string }) => {
    const taskRecord = await taskStore.getTask({
      entityId,
    });

    if (!taskRecord) {
      return;
    }

    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type === "assign") {
      throw new Error("Task is already assigned.");
    }

    const worker = await workerManager.selectWorker();

    if (!worker) {
      return;
    }

    await taskStore.assign({
      entityId: taskRecord.state.id,
      workerPeerIdStr: worker,
    });

    await workerManager.incrementStateValue(worker, "totalTasks");

    await manager.sendMessage(peerIdFromString(worker), {
      task: taskRecord.state,
    });
  };

  const manageTasks = async () => {
    try {
      const activeTasks = await taskStore.all({
        prefix: "tasks/active",
        limit: 50,
      });

      for (const taskRecord of activeTasks) {
        await manageTask(taskRecord);
      }
    } catch (e) {
      console.error("System error:", e);
    }
  };

  const getActiveTasks = async () => {
    const tasks = await taskStore.all({
      prefix: "tasks/active",
    });

    return tasks;
  };

  async function getPaginatedTasks(
    status: "active" | "completed",
    page: number = 1,
    perPage: number = 10,
  ): Promise<PaginatedResult<Task>> {
    // Validate inputs
    if (page < 1) page = 1;
    if (perPage < 1) perPage = 10;

    const query = {
      prefix: `/tasks/${status}/`,
      offset: (page - 1) * perPage,
      limit: perPage,
    };

    const results: any[] = [];
    for await (const result of taskStore.datastore.query(query)) {
      results.push(result);
    }

    let total = 0;
    const countQuery = {
      prefix: `/tasks/${status}/`,
    };
    for await (const _ of taskStore.datastore.queryKeys(countQuery)) {
      total++;
    }

    // Parse results
    const items = results
      .map((result) => {
        try {
          return parseWithBigInt(result.value.toString()) as Task;
        } catch (err) {
          console.error("Failed to parse task", err);
          return null;
        }
      })
      .filter(Boolean) as Task[];

    return {
      items,
      total,
      page,
      perPage,
      hasNext: page * perPage < total,
      hasPrevious: page > 1,
    };
  }

  const getCompletedTasks = async ({
    offset,
    limit,
  }: {
    offset: number;
    limit: number;
  }) => {
    const tasks = await taskStore.all({
      offset,
      limit,
      prefix: "tasks/completed",
    });

    return tasks;
  };

  const registerTemplate = async ({
    providerPeerIdStr,
    template,
  }: {
    providerPeerIdStr: string;
    template: Template;
  }) => {
    const entityId = computeTemplateId(providerPeerIdStr, template.data);

    if (template.templateId !== entityId) {
      throw new Error("Template ID does not match the computed ID");
    }

    await templateStore.create({
      template,
      createdByPeer: providerPeerIdStr,
    });

    return template;
  };

  return {
    getTask,
    createTask,
    processTaskAcception,
    processTaskRejection,
    processTaskSubmission,

    registerTemplate,

    manageTask,
    manageTasks,
    assignTask,

    getActiveTasks,
    getCompletedTasks,

    getPaginatedTasks,
  };
}
