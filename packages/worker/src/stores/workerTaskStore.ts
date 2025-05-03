import {
  type TaskRecord,
  type BaseTaskEvent,
  type PeerId,
  type Datastore,
  type Task,
  Key,
  TaskValidationError,
  TaskExpiredError,
  createEntityStore,
  stringifyWithBigInt,
  parseWithBigInt,
  TASK_ACCEPTANCE_TIME,
} from "@effectai/protocol-core";

export type WorkerTaskEvents =
  | TaskCreatedEvent
  | TaskCompletedEvent
  | TaskAcceptedEvent
  | TaskRejectedEvent
  | TaskExpiredEvent;

export interface TaskCreatedEvent extends BaseTaskEvent {
  type: "create";
  managerPeer: string;
}

export interface TaskCompletedEvent extends BaseTaskEvent {
  type: "complete";
  result: string;
}

export interface TaskAcceptedEvent extends BaseTaskEvent {
  type: "accept";
}

export interface TaskRejectedEvent extends BaseTaskEvent {
  type: "reject";
  reason: string;
}

export interface TaskExpiredEvent extends BaseTaskEvent {
  type: "expire";
}

export type WorkerTaskRecord = TaskRecord<WorkerTaskEvents>;

export const createWorkerTaskStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<WorkerTaskEvents, WorkerTaskRecord>({
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
  }): Promise<WorkerTaskRecord> => {
    const taskRecord = await coreStore.get({
      entityId: `${index}/${entityId}`,
    });

    if (!taskRecord) {
      throw new Error("Task not found");
    }

    return taskRecord;
  };

  const saveTask = async ({
    entityId,
    record,
    index = "active",
  }: {
    entityId: string;
    record: WorkerTaskRecord;
    index?: string;
  }): Promise<void> => {
    await coreStore.put({ entityId: `${index}/${entityId}`, record });
  };

  const create = async ({
    task,
    managerPeerId,
  }: {
    task: Task;
    managerPeerId: PeerId;
  }): Promise<WorkerTaskRecord> => {
    const record: WorkerTaskRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
          managerPeer: managerPeerId.toString(),
        },
      ],
      state: task,
    };

    //TODO:: check if task already exist ?
    await saveTask({
      entityId: task.id,
      record,
    });

    return record;
  };

  const complete = async ({
    entityId,
    result,
  }: {
    entityId: string;
    result: string;
  }): Promise<WorkerTaskRecord> => {
    const taskRecord = await getTask({
      entityId,
    });

    if (taskRecord.events.some((e) => e.type === "complete")) {
      throw new TaskValidationError("Task is already completed");
    }

    // only allowed to complete if last event is accept
    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type !== "accept") {
      throw new TaskValidationError("Task was not accepted..");
    }

    if (
      Date.now() / 1000 - lastEvent.timestamp >=
      taskRecord.state.timeLimitSeconds
    ) {
      throw new TaskExpiredError("Task has expired.");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "complete",
      result,
    });

    const batch = coreStore.datastore.batch();
    batch.put(
      new Key(`/tasks/completed/${entityId}`),
      Buffer.from(stringifyWithBigInt(taskRecord)),
    );
    batch.delete(new Key(`/tasks/active/${entityId}`));
    await batch.commit();

    return taskRecord;
  };

  const accept = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<WorkerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    const created = taskRecord.events.find(
      (t: WorkerTaskEvents) => t.type === "create",
    );

    if (!created) {
      throw new Error("Task not created.");
    }

    if (Date.now() / 1000 - created.timestamp >= TASK_ACCEPTANCE_TIME) {
      throw new TaskExpiredError("Task has expired.");
    }

    const event: TaskAcceptedEvent = {
      timestamp: Math.floor(Date.now() / 1000),
      type: "accept",
    };

    taskRecord.events.push(event);

    await saveTask({
      entityId,
      record: taskRecord,
    });

    return taskRecord;
  };

  const reject = async ({
    entityId,
    reason,
  }: {
    entityId: string;
    reason: string;
  }): Promise<WorkerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    const lastEvent = taskRecord.events[taskRecord.events.length - 1];
    if (lastEvent.type !== "create") {
      throw new TaskValidationError("Task was not created.");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "reject",
      reason,
    });

    const batch = coreStore.datastore.batch();
    batch.put(
      new Key(`/tasks/rejected/${entityId}`),
      Buffer.from(stringifyWithBigInt(taskRecord)),
    );
    batch.delete(new Key(`/tasks/active/${entityId}`));
    await batch.commit();

    return taskRecord;
  };

  const expire = async ({ entityId }: { entityId: string }) => {
    const taskRecord = await getTask({ entityId });

    const lastEvent = taskRecord.events[taskRecord.events.length - 1];

    if (lastEvent.type !== "create") {
      throw new TaskValidationError("Task was not created.");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "expire",
    });

    //move task to expired index
    const batch = coreStore.datastore.batch();
    batch.put(
      new Key(`/tasks/expired/${entityId}`),
      Buffer.from(stringifyWithBigInt(taskRecord)),
    );
    batch.delete(new Key(`/tasks/active/${entityId}`));
    await batch.commit();
  };

  return {
    ...coreStore,
    create,
    complete,
    accept,
    reject,
    expire,
  };
};
export type WorkerTaskStore = ReturnType<typeof createWorkerTaskStore>;
