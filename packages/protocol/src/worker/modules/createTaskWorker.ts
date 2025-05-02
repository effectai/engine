import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import type {
  WorkerTaskRecord,
  WorkerTaskStore,
} from "../stores/workerTaskStore.js";
import { peerIdFromString } from "@libp2p/peer-id";
import type { WorkerEntity, WorkerEvents } from "../main.js";
import type { Task } from "../../core/messages/effect.js";
import type { createTemplateWorker } from "./createTemplateWorker.js";

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
    index = "active",
  }: {
    taskId: string;
    index?: string;
  }): Promise<WorkerTaskRecord> => {
    const taskRecord = await taskStore.get({
      entityId: `${index}/${taskId}`,
    });

    if (!taskRecord) {
      throw new Error("Task not found");
    }

    return taskRecord;
  };

  const getTasks = async ({
    prefix = undefined,
    limit = 50,
  }: {
    prefix?: string;
    limit?: number;
  }) => {
    try {
      return await taskStore.all({
        prefix,
        limit,
      });
    } catch (e) {
      console.error("Error getting tasks:", e);
      throw new Error("Failed to get tasks");
    }
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
  }): Promise<WorkerTaskRecord> => {
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
    events.safeDispatchEvent("task:accepted", { detail: taskRecord.state });

    return taskRecord;
  };

  const completeTask = async ({
    taskId,
    result,
  }: {
    taskId: string;
    result: string;
  }) => {
    try {
      const taskRecord = await taskStore.complete({
        entityId: taskId,
        result,
      });

      const { managerPeer } = extractMetadata(taskRecord);

      if (!managerPeer) {
        throw new Error("no manager peer found");
      }

      // send completed message to manager
      const [response, error] = await entity.sendMessage(
        peerIdFromString(managerPeer),
        {
          taskCompleted: {
            taskId: taskRecord.state.id,
            worker: entity.toString(),
            result,
          },
        },
      );

      if (error) {
        console.error("Error sending task completed message:", error);
        throw new Error("Failed to send task completed message");
      }

      events.safeDispatchEvent("task:completed", { detail: taskRecord });
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error completing task:", error.message);

        await taskStore.rollbackEvent({
          entityId: taskId,
          eventType: "complete",
        });
      } else {
        console.error("Error completing task:", error);
      }
    }
  };

  const rejectTask = async ({
    taskId,
    reason,
  }: {
    taskId: string;
    reason: string;
  }) => {
    const taskRecord = await taskStore.reject({
      entityId: taskId,
      reason,
    });

    const { managerPeer } = extractMetadata(taskRecord);
    if (!managerPeer) {
      throw new Error("no manager peer found");
    }

    // send completed message to manager
    const [response, error] = await entity.sendMessage(
      peerIdFromString(managerPeer),
      {
        taskRejected: {
          timestamp: Math.floor(Date.now() / 1000),
          worker: entity.toString(),
          taskId,
          reason,
        },
      },
    );

    events.safeDispatchEvent("task:rejected", {
      detail: {
        taskId,
        reason,
      },
    });
  };

  //render task template html and prefill the data on the placeholders
  //placeholders: ${key} matches the key in the template data
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

    try {
      const templateData = JSON.parse(taskRecord.state.templateData);

      const templateHtml = template.data.replace(/\$\{([^}]+)\}/g, (_, key) => {
        const value = templateData[key.trim()];
        return value !== undefined ? value : "";
      });

      return templateHtml;
    } catch (error) {
      console.error("Error parsing template data:", error);
      throw new Error("Failed to parse template data");
    }
  };

  //cleanup stale / expired tasks
  const cleanup = async () => {
    const tasks = await taskStore.all({
      prefix: "tasks/active",
      limit: 100,
    });

    const now = Math.floor(Date.now() / 1000);
    //a task is considered expired if it has not been accepted or rejected in 10 minutes
    //or if it has been accepted and not completed in task.state.taskTime
    const expiredTasks = tasks.filter((task) => {
      const lastTaskEvent = task.events[task.events.length - 1];

      if (lastTaskEvent.type === "accept") {
        const acceptedAt = lastTaskEvent.timestamp;
        return now - acceptedAt > task.state.timeLimitSeconds;
      }

      if (lastTaskEvent.type === "create") {
        const createdAt = lastTaskEvent.timestamp;
        //TODO:: fetch this from manager connection state
        return now - createdAt > 600;
      }

      return false;
    });

    for (const task of expiredTasks) {
      await taskStore.expire({ entityId: task.state.id });
    }
  };

  return {
    getTask,
    getTasks,
    createTask,
    completeTask,
    acceptTask,
    rejectTask,
    renderTask,
    cleanup,
  };
}
