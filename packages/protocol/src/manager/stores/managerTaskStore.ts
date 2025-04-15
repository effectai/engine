import type { PeerId, TypedEventEmitter } from "@libp2p/interface";
import { Key, type Datastore } from "interface-datastore";
import { ACTIVE_TASK_TRESHOLD, TASK_ACCEPTANCE_TIME } from "../consts.js";
import type { BaseTaskEvent, TaskRecord } from "../../core/common/types.js";
import { TaskValidationError, TaskExpiredError } from "../../core/errors.js";
import type { Payment, Task } from "../../core/messages/effect.js";
import { createEntityStore } from "../../core/store.js";
import { parseWithBigInt, stringifyWithBigInt } from "../../core/utils.js";
import { P } from "pino";

export type ManagerTaskEvent =
  | TaskCreatedEvent
  | TaskAssignedEvent
  | TaskSubmissionEvent
  | TaskRejectedEvent
  | TaskAcceptedEvent
  | TaskPaymentEvent;

export interface TaskCreatedEvent extends BaseTaskEvent {
  type: "create";
  providerPeer: string;
}

export interface TaskAssignedEvent extends BaseTaskEvent {
  type: "assign";
  assignedToPeer: string;
}

export interface TaskAcceptedEvent extends BaseTaskEvent {
  type: "accept";
  acceptedByPeer: string;
}

export interface TaskRejectedEvent extends BaseTaskEvent {
  type: "reject";
  reason: string;
  rejectedByPeer: string;
}

export interface TaskSubmissionEvent extends BaseTaskEvent {
  type: "submission";
  result: string;
  submissionByPeer: string;
}

export interface TaskPaymentEvent extends BaseTaskEvent {
  type: "payout";
  payment: Payment;
}

export interface TaskCompletedEvent extends BaseTaskEvent {
  type: "complete";
  result: string;
  completedByPeer: string;
}

export type ManagerTaskRecord = TaskRecord<ManagerTaskEvent>;

export const createManagerTaskStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<ManagerTaskEvent, ManagerTaskRecord>({
    datastore,
    defaultPrefix: "tasks",
    stringify: (record) => stringifyWithBigInt(record),
    parse: (data) => parseWithBigInt(data),
  });

  const getTask = async ({
    entityId,
    index = "active",
  }: {
    entityId: string;
    index?: string;
  }): Promise<ManagerTaskRecord | null> => {
    try {
      const taskRecord = await coreStore.get({
        entityId: `${index}/${entityId}`,
      });

      if (!taskRecord) {
        throw new TaskValidationError("Task not found");
      }

      return taskRecord;
    } catch (e) {
      if (e instanceof TaskValidationError) {
        throw e;
      }
      throw new TaskValidationError("Task not found");
    }
  };

  const moveToCompletedIndex = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<void> => {
    const taskRecord = await getTask({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    const b = datastore.batch();
    b.put(
      new Key(`/tasks/completed/${taskRecord.state.id}`),
      Buffer.from(stringifyWithBigInt(taskRecord)),
    );
    b.delete(new Key(`/tasks/active/${taskRecord.state.id}`));

    await b.commit();
  };

  const moveToActiveIndex = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<void> => {
    const taskRecord = await coreStore.get({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    const b = datastore.batch();
    b.put(
      new Key(`/tasks/active/${taskRecord.state.id}`),
      Buffer.from(stringifyWithBigInt(taskRecord)),
    );
    b.delete(new Key(`/tasks/backlog/${taskRecord.state.id}`));

    await b.commit();
  };

  const moveBulkToActiveIndex = async ({
    n,
  }: { n: number }): Promise<number> => {
    const backlogTasks = await coreStore.all({
      prefix: "tasks/backlog",
      limit: n,
    });

    const b = datastore.batch();
    for (let i = 0; i < backlogTasks.length; i++) {
      b.put(
        new Key(`/tasks/active/${backlogTasks[i].state.id}`),
        Buffer.from(stringifyWithBigInt(backlogTasks[i])),
      );
      b.delete(new Key(`/tasks/backlog/${i}`));
    }

    await b.commit();

    return backlogTasks.length;
  };

  const create = async ({
    task,
    providerPeerIdStr,
  }: {
    task: Task;
    providerPeerIdStr: string;
  }): Promise<ManagerTaskRecord> => {
    const record: ManagerTaskRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
          providerPeer: providerPeerIdStr,
        },
      ],
      state: task,
    };

    await coreStore.put({ entityId: `active/${task.id}`, record });

    return record;
  };

  const complete = async ({
    entityId,
    result,
    peerIdStr,
  }: {
    entityId: string;
    result: string;
    peerIdStr: string;
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    if (taskRecord.events.some((e) => e.type === "submission")) {
      throw new TaskValidationError("Task is already submitted");
    }

    // only allowed to complete if last event is accept
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];
    if (lastEvent.type !== "accept" || lastEvent.acceptedByPeer !== peerIdStr) {
      throw new TaskValidationError("Task was not accepted by this worker");
    }

    if (
      Date.now() / 1000 - lastEvent.timestamp >=
      taskRecord.state.timeLimitSeconds
    ) {
      throw new TaskExpiredError("Task has expired.");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "submission",
      result,
      submissionByPeer: peerIdStr,
    });

    await coreStore.put({
      entityId: `active/${entityId}`,
      record: taskRecord,
    });

    return taskRecord;
  };

  const accept = async ({
    entityId,
    peerIdStr,
  }: {
    entityId: string;
    peerIdStr: string;
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    // only allowed to accept if last event is assign
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type !== "assign" || lastEvent.assignedToPeer !== peerIdStr) {
      throw new TaskValidationError("Task was not assigned to this worker");
    }

    if (Date.now() / 1000 - lastEvent.timestamp >= TASK_ACCEPTANCE_TIME) {
      throw new TaskExpiredError("Task has expired.");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "accept",
      acceptedByPeer: peerIdStr,
    });

    await coreStore.put({ entityId: `active/${entityId}`, record: taskRecord });

    return taskRecord;
  };

  const reject = async ({
    entityId,
    peerIdStr,
    reason,
  }: {
    entityId: string;
    peerIdStr: string;
    reason: string;
  }): Promise<void> => {
    const taskRecord = await getTask({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "reject",
      reason,
      rejectedByPeer: peerIdStr,
    });

    await coreStore.put({ entityId: `active/${entityId}`, record: taskRecord });
  };

  const payout = async ({
    entityId,
    payment,
  }: {
    entityId: string;
    payment: Payment;
  }): Promise<void> => {
    const taskRecord = await getTask({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    // only allowed to payout if last event is complete
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type !== "submission") {
      throw new TaskValidationError("Task is not submitted yet");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "payout",
      payment,
    });

    await coreStore.put({ entityId: `active/${entityId}`, record: taskRecord });
  };

  const assign = async ({
    entityId,
    workerPeerIdStr,
  }: {
    entityId: string;
    workerPeerIdStr: string;
  }): Promise<void> => {
    const taskRecord = await getTask({ entityId });

    if (!taskRecord) {
      throw new TaskValidationError("Task not found");
    }

    // only allowed to assign if last event is create or reject.
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type !== "create" && lastEvent.type !== "reject") {
      throw new TaskValidationError("Task is not in a valid state to assign");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "assign",
      assignedToPeer: workerPeerIdStr,
    });

    await coreStore.put({ entityId: `active/${entityId}`, record: taskRecord });
  };

  return {
    ...coreStore,
    create,
    complete,
    accept,
    reject,
    payout,
    assign,
    moveToActiveIndex,
    moveBulkToActiveIndex,
    moveToCompletedIndex,
    getTask,
  };
};

export type ManagerTaskStore = ReturnType<typeof createManagerTaskStore>;
