import { PublicKey } from "@solana/web3.js";
import { peerIdFromString } from "@libp2p/peer-id";
import {
  BATCH_SIZE,
  TASK_ACCEPTANCE_TIME,
  ACTIVE_TASK_TRESHOLD,
} from "../consts.js";
import type { createManager, ManagerEntity, ManagerEvents } from "../main.js";
import type { createWorkerQueue } from "./createWorkerQueue.js";
import type { createPaymentManager } from "./createPaymentManager.js";
import type {
  ManagerTaskRecord,
  ManagerTaskStore,
  TaskAcceptedEvent,
  TaskAssignedEvent,
  TaskRejectedEvent,
  TaskSubmissionEvent,
} from "../stores/managerTaskStore.js";
import { managerLogger } from "../../core/logging.js";
import type { TypedEventEmitter } from "@libp2p/interface";
import type { Task, Template } from "../../core/messages/effect.js";
import { TemplateStore } from "../../core/common/stores/templateStore.js";
import { createWorkerManager } from "./createWorkerManager.js";
import { computeTemplateId } from "../../core/utils.js";

export function createTaskManager({
  manager,

  paymentManager,
  workerManager,

  events,

  taskStore,
  templateStore,
}: {
  manager: ManagerEntity;

  paymentManager: Awaited<ReturnType<typeof createPaymentManager>>;
  workerManager: ReturnType<typeof createWorkerManager>;

  events: TypedEventEmitter<ManagerEvents>;

  taskStore: ManagerTaskStore;
  templateStore: TemplateStore;
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

    await workerManager.incrementTasksAccepted(workerPeerIdStr);

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

    await workerManager.incrementTasksRejected(workerPeerIdStr);

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

    await workerManager.incrementTasksCompleted(workerPeerIdStr);

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
      managerLogger.info("Worker took too long to accept/reject task");

      await taskStore.reject({
        entityId: taskRecord.state.id,
        peerIdStr: lastEvent.assignedToPeer,
        reason: "Worker took too long to accept/reject task",
      });
      await workerManager.incrementTasksRejected(lastEvent.assignedToPeer);
      await assignTask({ entityId: taskRecord.state.id });
    }
  };

  const handleAcceptEvent = async (
    taskRecord: ManagerTaskRecord,
    lastEvent: TaskAcceptedEvent,
  ) => {
    if (isExpired(lastEvent.timestamp, taskRecord.state.timeLimitSeconds)) {
      managerLogger.info("Worker took too long to complete task");

      await taskStore.reject({
        entityId: taskRecord.state.id,
        peerIdStr: lastEvent.acceptedByPeer,
        reason: "Worker took too long to accept/reject task",
      });
      await workerManager.incrementTasksRejected(lastEvent.acceptedByPeer);

      await assignTask({ entityId: taskRecord.state.id });
    }
  };

  const handleSubmissionEvent = async (
    taskRecord: ManagerTaskRecord,
    event: TaskSubmissionEvent,
  ) => {
    const payment = await paymentManager.generatePayment({
      peerId: peerIdFromString(event.submissionByPeer),
      amount: taskRecord.state.reward,
      paymentAccount: new PublicKey(
        "796qppG6jGia39AE8KLENa2mpRp5VCtm48J8JsokmwEL",
      ),
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

    //sendout task completed event
    events.safeDispatchEvent("task:completed", { detail: taskRecord });

    return {
      ack,
      error,
    };
  };

  const handleRejectEvent = async (
    taskRecord: ManagerTaskRecord,
    event: TaskRejectedEvent,
  ) => {
    //this task got rejected, lets just re-assign it for now.
    await assignTask({ entityId: taskRecord.state.id });
  };

  const manageTask = async (taskRecord: ManagerTaskRecord) => {
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (!lastEvent) {
      managerLogger.error("No events found in taskRecord");
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
        await handleRejectEvent(taskRecord, lastEvent);
        break;
      case "submission":
        await handleSubmissionEvent(taskRecord, lastEvent);
        break;
      case "payout":
        // do nothing..
        break;
      default:
        managerLogger.error(`Unknown task event type: ${lastEvent}`);
    }
  };

  const assignTask = async ({ entityId }: { entityId: string }) => {
    const taskRecord = await taskStore.getTask({
      entityId,
    });

    if (!taskRecord) {
      managerLogger.error("Task not found");
      return;
    }

    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type === "assign") {
      throw new Error("Task is already assigned.");
    }

    const worker = await workerManager.selectWorker(0);

    if (!worker) {
      managerLogger.info("No available workers to assign task to");
      return;
    }

    await taskStore.assign({
      entityId: taskRecord.state.id,
      workerPeerIdStr: worker,
    });

    await workerManager.incrementTotalTasks(worker);

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

      console.log(`Managing ${activeTasks.length} active tasks`);

      for (const taskRecord of activeTasks) {
        await manageTask(taskRecord);
      }
    } catch (e) {
      console.error("System error:", e);
    }
  };

  const getPendingTasks = async () => {
    const tasks = await taskStore.all();

    return tasks.filter((task) =>
      task.events.every((event) => event.type !== "payout"),
    );
  };

  const getCompletedTasks = async () => {
    const tasks = await taskStore.all({
      prefix: "tasks/completed",
      limit: 500,
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

    getPendingTasks,
    getCompletedTasks,
  };
}
