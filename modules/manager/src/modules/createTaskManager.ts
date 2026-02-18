import { PublicKey } from "@solana/web3.js";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import type { ManagerEntity, ManagerEvents, ManagerSettings } from "../main.js";
import type { createPaymentManager } from "./createPaymentManager.js";
import type {
  ManagerTaskRecord,
  ManagerTaskStore,
  TaskStatus,
} from "../stores/managerTaskStore.js";

import type { createWorkerManager } from "./createWorkerManager.js";
import { computeTemplateId } from "../utils.js";

import {
  type TypedEventEmitter,
  type TemplateStore,
  peerIdFromString,
} from "@effectai/protocol-core";

import type { Task, Template } from "@effectai/protobufs";

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
  const isExpired = (deadlineSeconds?: number) =>
    typeof deadlineSeconds === "number" &&
    deadlineSeconds < Math.floor(Date.now() / 1000);

  const getTask = async ({
    taskId,
  }: {
    taskId: string;
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await taskStore.getTask({
      entityId: taskId,
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
    await workerManager.setWorkerStatus(workerPeerIdStr, "accepted");

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
    await taskStore.reject({
      entityId: taskId,
      peerIdStr: workerPeerIdStr,
      reason,
    });

    await workerManager.markTaskReleased(workerPeerIdStr, taskId);

    const taskRecord = await taskStore.getTask({
      entityId: taskId,
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

    await workerManager.markTaskReleased(workerPeerIdStr, taskId);

    await workerManager.incrementStateValue(workerPeerIdStr, "tasksCompleted");

    events.safeDispatchEvent("task:submission", {
      detail: taskRecord,
    });
  };

  const handleCreateEvent = async (taskRecord: ManagerTaskRecord) => {
    await assignTask({ entityId: taskRecord.state.id });
  };

  const handleAssignEvent = async (taskRecord: ManagerTaskRecord) => {
    if (isExpired(taskRecord.state.acceptanceDeadline)) {
      await rejectAndReassignTask(taskRecord);
    }
  };

  const rejectAndReassignTask = async (
    taskRecord: ManagerTaskRecord,
    reason = "Worker took too long to accept/reject task",
  ) => {
    if (!taskRecord.state.assignedTo) {
      return;
    }

    await taskStore.reject({
      entityId: taskRecord.state.id,
      peerIdStr: taskRecord.state.assignedTo,
      reason,
    });

    await workerManager.markTaskReleased(
      taskRecord.state.assignedTo,
      taskRecord.state.id,
    );

    await workerManager.incrementStateValue(
      taskRecord.state.assignedTo,
      "tasksRejected",
    );

    //re-assign the task to another worker.
    await assignTask({ entityId: taskRecord.state.id });
  };

  const handleAcceptEvent = async (taskRecord: ManagerTaskRecord) => {
    if (isExpired(taskRecord.state.completionDeadline)) {
      await rejectAndReassignTask(
        taskRecord,
        "Worker took too long to submit task",
      );
    }
  };

  const handleSubmissionEvent = async (taskRecord: ManagerTaskRecord) => {
    if (!managerSettings.paymentAccount) {
      throw new Error("Payment account not set, cannot process payout");
    }

    const submissionPeer = taskRecord.state.submissionBy;
    if (!submissionPeer) {
      throw new Error("Submission peer not found for task");
    }

    const payment = await paymentManager.generatePayment({
      peerId: peerIdFromString(submissionPeer),
      amount: taskRecord.state.task.reward,
      paymentAccount: new PublicKey(managerSettings.paymentAccount),
      label: `Payment for task: ${taskRecord.state.id}`,
      taskId: taskRecord.state.id,
    });

    await taskStore.payout({
      entityId: taskRecord.state.id,
      payment,
    });

    //send the payment.
    const [ack, error] = await manager.sendMessage(
      peerIdFromString(submissionPeer),
      { payment },
    );

    //update state
    await workerManager.updateWorkerState(submissionPeer, (state) => ({
      totalEarned: state.totalEarned + BigInt(taskRecord.state.task.reward),
      status: "idle",
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
    switch (taskRecord.state.status) {
      case "created":
        await handleCreateEvent(taskRecord);
        break;
      case "assigned":
        await handleAssignEvent(taskRecord);
        break;
      case "accepted":
        await handleAcceptEvent(taskRecord);
        break;
      case "rejected":
        await handleRejectEvent(taskRecord);
        break;
      case "submitted":
        await handleSubmissionEvent(taskRecord);
        break;
      case "payout_pending":
      case "completed":
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

    if (taskRecord.state.status === "assigned") {
      throw new Error("Task is already assigned.");
    }

    const originalWorkerId = taskRecord?.state.task.templateData
      ? JSON.parse(taskRecord.state.task.templateData)?.submissionByPeer
      : undefined;

    const worker = await workerManager.selectWorker(
      taskRecord.state.task.capability || undefined,
      originalWorkerId || undefined,
    );

    if (!worker) {
      return;
    }

    await taskStore.assign({
      entityId: taskRecord.state.id,
      workerPeerIdStr: worker,
    });

    await workerManager.markTaskAssigned(worker, taskRecord.state.id);

    await workerManager.incrementStateValue(worker, "totalTasks");

    await manager.sendMessage(peerIdFromString(worker), {
      task: taskRecord.state.task,
    });
  };

  const manageTasks = async () => {
    try {
      const statuses: TaskStatus[] = [
        "created",
        "assigned",
        "accepted",
        "submitted",
      ];

      for (const status of statuses) {
        const tasks = await taskStore.listByStatus({
          status,
          limit: 50,
        });
        for (const taskRecord of tasks) {
          await manageTask(taskRecord);
        }
      }
    } catch (e) {
      console.error("System error:", e);
    }
  };

  const getActiveTasks = async () => {
    const statuses: TaskStatus[] = ["created", "assigned", "accepted", "submitted"];
    const tasks = [] as ManagerTaskRecord[];
    for (const status of statuses) {
      tasks.push(...(await taskStore.listByStatus({ status })));
    }

    return tasks;
  };

  const getCompletedTaskCount = async () => {
    let total = 0;
    for await (const _ of taskStore.datastore.queryKeys({
      prefix: "/tasks/byStatus/completed",
    })) {
      total++;
    }

    return total;
  };

  const getCompletedTasks = async ({
    offset,
    limit,
  }: {
    offset: number;
    limit: number;
  }) => {
    const tasks = await taskStore.listByStatus({
      status: "completed",
      limit: offset + limit,
    });

    return tasks.slice(offset, offset + limit);
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
    getCompletedTaskCount,
  };
}

export type TaskManager = ReturnType<typeof createTaskManager>;
