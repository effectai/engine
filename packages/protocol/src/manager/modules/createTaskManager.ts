import { PublicKey } from "@solana/web3.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import type { createManager, ManagerEvents } from "../main.js";
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
import type { createEffectEntity } from "../../core/entity/factory.js";
import type { Libp2pTransport } from "../../core/transports/libp2p.js";
import type { Task } from "../../core/messages/effect.js";

export function createTaskManager({
  manager,
  workerQueue,
  taskStore,
  paymentManager,
  eventEmitter,
}: {
  manager: Awaited<ReturnType<typeof createEffectEntity<Libp2pTransport[]>>>;
  taskStore: ManagerTaskStore;
  paymentManager: ReturnType<typeof createPaymentManager>;
  workerQueue: ReturnType<typeof createWorkerQueue>;
  eventEmitter: TypedEventEmitter<ManagerEvents>;
}) {
  const isExpired = (timestamp: number) =>
    timestamp + TASK_ACCEPTANCE_TIME < Math.floor(Date.now() / 1000);

  const createTask = async ({
    task,
    providerPeerIdStr,
  }: {
    task: Task;
    providerPeerIdStr: string;
  }) => {
    const taskRecord = await taskStore.create({
      task,
      providerPeerIdStr,
    });

    eventEmitter.safeDispatchEvent("task:created", {
      detail: taskRecord,
    });
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

    eventEmitter.safeDispatchEvent("task:accepted", {
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

    eventEmitter.safeDispatchEvent("task:rejected", {
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

    eventEmitter.safeDispatchEvent("task:submission", {
      detail: taskRecord,
    });
  };

  const handleCreateEvent = async (taskRecord: ManagerTaskRecord) => {
    await assignTask({ taskRecord });
  };

  const handleAssignEvent = async (
    taskRecord: ManagerTaskRecord,
    lastEvent: TaskAssignedEvent,
  ) => {
    if (isExpired(lastEvent.timestamp)) {
      managerLogger.info("Worker took too long to accept/reject task");

      await taskStore.reject({
        entityId: taskRecord.state.id,
        peerIdStr: lastEvent.assignedToPeer,
        reason: "Worker took too long to accept/reject task",
      });

      await assignTask({ taskRecord });
    }
  };

  const handleAcceptEvent = async (
    taskRecord: ManagerTaskRecord,
    lastEvent: TaskAcceptedEvent,
  ) => {
    if (isExpired(lastEvent.timestamp)) {
      managerLogger.info("Worker took too long to accept/reject task");
      await assignTask({ taskRecord });
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

    //create payout event
    await taskStore.payout({
      entityId: taskRecord.state.id,
      payment,
    });

    //send the payment.
    manager.sendMessage(peerIdFromString(event.submissionByPeer), {
      payment,
    });

    //sendout task completed event
    eventEmitter.safeDispatchEvent("task:completed", { detail: taskRecord });
  };

  const handleRejectEvent = async (
    taskRecord: ManagerTaskRecord,
    event: TaskRejectedEvent,
  ) => {
    //this task got rejected, lets just re-assign it for now.
    await assignTask({ taskRecord });
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
        managerLogger.error(`Unknown task event type: ${lastEvent.type}`);
    }
  };

  const assignTask = async ({
    taskRecord,
  }: { taskRecord: ManagerTaskRecord }) => {
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type === "assign") {
      throw new Error("Task is already assigned.");
    }

    const worker = workerQueue.dequeuePeer();

    if (!worker) {
      managerLogger.info("No available workers to assign task to");
      return;
    }

    await taskStore.assign({
      entityId: taskRecord.state.id,
      workerPeerIdStr: worker,
    });

    const ack = await manager.sendMessage(peerIdFromString(worker), {
      task: taskRecord.state,
    });
  };

  const manageTasks = async () => {
    try {
      const tasks = await taskStore.all();
      managerLogger.info(`Managing ${tasks.length} tasks`);

      for (const task of tasks) {
        await manageTask(task);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return {
    createTask,
    processTaskAcception,
    processTaskRejection,
    processTaskSubmission,
    manageTask,
    manageTasks,
    assignTask,
  };
}
