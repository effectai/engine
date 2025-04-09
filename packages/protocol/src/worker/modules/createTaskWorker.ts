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
import type { WorkerEvents } from "../main.js";
import { Task } from "../../core/messages/effect.js";

export function createTaskWorker({
  taskStore,
  worker,
  eventEmitter,
}: {
  eventEmitter: TypedEventEmitter<WorkerEvents>;
  worker: Awaited<ReturnType<typeof createEffectEntity<Libp2pTransport[]>>>;
  taskStore: WorkerTaskStore;
}) {
  const extractMetadata = (task: WorkerTaskRecord) => {
    const managerPeer = task.events.find(
      (e) => e.type === "create",
    )?.managerPeer;

    return { managerPeer };
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

    eventEmitter.safeDispatchEvent("task:created", { detail: task });
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
    await worker.sendMessage(peerIdFromString(managerPeer), {
      taskAccepted: {
        timestamp: Math.floor(Date.now() / 1000),
        taskId: taskId,
        worker: worker.node.peerId.toString(),
      },
    });

    //emit task accepted event
    eventEmitter.safeDispatchEvent("task:accepted", { detail: taskRecord });
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
    await worker.sendMessage(peerIdFromString(managerPeer), {
      taskCompleted: {
        taskId: taskRecord.state.id,
        worker: worker.toString(),
        result,
      },
    });

    eventEmitter.safeDispatchEvent("task:completed", { detail: taskRecord });
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

    eventEmitter.safeDispatchEvent("task:rejected", { detail: taskRecord });
  };

  return {
    createTask,
    completeTask,
    acceptTask,
    rejectTask,
  };
}
