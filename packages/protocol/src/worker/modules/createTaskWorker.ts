import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import { TASK_ACCEPTANCE_TIME } from "../../manager/consts.js";
import type {
  TaskAcceptedEvent,
  WorkerTaskEvents,
  WorkerTaskRecord,
  WorkerTaskStore,
} from "../stores/workerTaskStore.js";
import { peerIdFromString } from "@libp2p/peer-id";
import type { createEffectEntity } from "../../core/entity/factory.js";
import type { Libp2pTransport } from "../../core/transports/libp2p.js";
import type { WorkerEntity, WorkerEvents } from "../main.js";
import { Task } from "../../core/messages/effect.js";
import { createTemplateWorker } from "./createTemplateWorker.js";

export function createTaskWorker({
  entity,
  taskStore,
  events,
  templateWorker,
}: {
  entity: WorkerEntity;
  events: TypedEventEmitter<WorkerEvents>;
  taskStore: WorkerTaskStore;
  templateWorker: ReturnType<typeof createTemplateWorker>;
}) {
  const extractMetadata = (task: WorkerTaskRecord) => {
    const managerPeer = task.events.find(
      (e) => e.type === "create",
    )?.managerPeer;

    return { managerPeer };
  };

  const getTask = async ({
    taskId,
  }: {
    taskId: string;
  }): Promise<WorkerTaskRecord> => {
    const taskRecord = await taskStore.get({
      entityId: taskId,
    });

    if (!taskRecord) {
      throw new Error("Task not found");
    }

    return taskRecord;
  };

  const createTask = async ({
    task,
    managerPeerId,
  }: {
    managerPeerId: PeerId;
    task: Task;
  }) => {
    await taskStore.create({
      task,
      managerPeerId,
    });

    events.safeDispatchEvent("task:created", { detail: task });
  };

  const acceptTask = async ({
    taskId,
  }: {
    taskId: string;
  }): Promise<void> => {
    const taskRecord = await taskStore.accept({
      entityId: taskId,
    });

    const { managerPeer } = extractMetadata(taskRecord);
    if (!managerPeer) {
      throw new Error("no manager peer..");
    }

    // send accepted message to manager
    await entity.sendMessage(peerIdFromString(managerPeer), {
      taskAccepted: {
        timestamp: Math.floor(Date.now() / 1000),
        taskId: taskId,
        worker: entity.node.peerId.toString(),
      },
    });

    //emit task accepted event
    events.safeDispatchEvent("task:accepted", { detail: taskRecord });
  };

  const completeTask = async ({
    taskId,
    result,
  }: {
    taskId: string;
    result: string;
  }) => {
    const taskRecord = await taskStore.complete({
      entityId: taskId,
      result,
    });

    const { managerPeer } = extractMetadata(taskRecord);

    if (!managerPeer) {
      throw new Error("no manager peer found");
    }

    // send completed message to manager
    await entity.sendMessage(peerIdFromString(managerPeer), {
      taskCompleted: {
        taskId: taskRecord.state.id,
        worker: entity.toString(),
        result,
      },
    });

    events.safeDispatchEvent("task:completed", { detail: taskRecord });
  };

  const rejectTask = async ({
    peerId,
    taskRecord,
    reason,
  }: { taskRecord: WorkerTaskRecord; reason: string; peerId: string }) => {
    await taskStore.reject({
      peerIdStr: peerId,
      entityId: taskRecord.state.id,
      reason,
    });

    events.safeDispatchEvent("task:rejected", { detail: taskRecord });
  };

  //render task template html and prefill the data on the placeholders
  //placeholders: {{key}} matches the key in the template data
  const renderTask = async ({
    taskRecord,
  }: {
    taskRecord: WorkerTaskRecord;
  }): Promise<string> => {
    const template = await templateWorker.getOrFetchTemplate({
      taskRecord,
      templateId: taskRecord.state.templateId,
    });

    if (!template) {
      throw new Error("Template not found");
    }

    const templateData = JSON.parse(taskRecord.state.templateData);

    const templateHtml = template.data.replace(/{{(.*?)}}/g, (_, key) => {
      const value = templateData[key.trim()];
      return value !== undefined ? value : "";
    });

    return templateHtml;
  };

  return {
    getTask,
    createTask,
    completeTask,
    acceptTask,
    rejectTask,
    renderTask,
  };
}
