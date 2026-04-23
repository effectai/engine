import { TASK_ACCEPTANCE_TIME } from "../consts.js";
import {
  type Datastore,
  type BaseTaskEvent,
  Key,
  TaskValidationError,
  TaskExpiredError,
  createEntityStore,
  stringifyWithBigInt,
  parseWithBigInt,
  isValid,
} from "@effectai/protocol-core";
import type { Task, Payment } from "@effectai/protobufs";

export type TaskStatus =
  | "created"
  | "assigned"
  | "accepted"
  | "submitted"
  | "payout_pending"
  | "completed"
  | "rejected";

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

export interface ManagerTaskState {
  id: string;
  task: Task;
  status: TaskStatus;
  providerPeer: string;
  assignedTo?: string;
  acceptedBy?: string;
  submissionBy?: string;
  result?: string;
  attempts: number;
  acceptanceDeadline?: number;
  completionDeadline?: number;
}

export interface ManagerTaskRecord {
  events: ManagerTaskEvent[];
  state: ManagerTaskState;
}

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

  const stateKey = (taskId: string) => new Key(`/tasks/state/${taskId}`);
  const statusKey = (status: TaskStatus, taskId: string) =>
    new Key(`/tasks/byStatus/${status}/${taskId}`);
  const workerKey = (workerId: string, taskId: string) =>
    new Key(`/tasks/byWorker/${workerId}/${taskId}`);

  const writeRecord = async ({
    record,
    previousStatus,
    nextStatus,
    previousAssignedTo,
    nextAssignedTo,
  }: {
    record: ManagerTaskRecord;
    previousStatus?: TaskStatus;
    nextStatus: TaskStatus;
    previousAssignedTo?: string;
    nextAssignedTo?: string;
  }) => {
    const batch = datastore.batch();

    batch.put(stateKey(record.state.id), Buffer.from(stringifyWithBigInt(record)));

    if (previousStatus && previousStatus !== nextStatus) {
      batch.delete(statusKey(previousStatus, record.state.id));
    }
    batch.put(statusKey(nextStatus, record.state.id), new Uint8Array());

    if (previousAssignedTo && previousAssignedTo !== nextAssignedTo) {
      batch.delete(workerKey(previousAssignedTo, record.state.id));
    }

    if (nextAssignedTo) {
      batch.put(workerKey(nextAssignedTo, record.state.id), new Uint8Array());
    }

    await batch.commit();
  };

  const getTask = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<ManagerTaskRecord> => {
    try {
      const taskRecord = await coreStore.get({
        entityId: `state/${entityId}`,
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

  const create = async ({
    task,
    providerPeerIdStr,
  }: {
    task: Task;
    providerPeerIdStr: string;
  }): Promise<ManagerTaskRecord> => {
    if (!isValid(task.id)) {
      throw new TaskValidationError("Task ID is not a valid ULID");
    }

    const record: ManagerTaskRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
          providerPeer: providerPeerIdStr,
        },
      ],
      state: {
        id: task.id,
        task,
        status: "created",
        providerPeer: providerPeerIdStr,
        attempts: 0,
      },
    };

    await writeRecord({
      record,
      nextStatus: "created",
    });

    return record;
  };

  const assign = async ({
    entityId,
    workerPeerIdStr,
  }: {
    entityId: string;
    workerPeerIdStr: string;
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    const { status } = taskRecord.state;
    if (status !== "created" && status !== "rejected") {
      throw new TaskValidationError("Task is not in a valid state to assign");
    }

    const acceptanceWindow =
      typeof taskRecord.state.task.timeLimitSeconds === "number" &&
      taskRecord.state.task.timeLimitSeconds > 0
        ? taskRecord.state.task.timeLimitSeconds
        : TASK_ACCEPTANCE_TIME;

    const previousAssignedTo = taskRecord.state.assignedTo;

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "assign",
      assignedToPeer: workerPeerIdStr,
    });

    taskRecord.state.status = "assigned";
    taskRecord.state.assignedTo = workerPeerIdStr;
    taskRecord.state.acceptanceDeadline =
      Math.floor(Date.now() / 1000) + acceptanceWindow;
    taskRecord.state.attempts += 1;

    await writeRecord({
      record: taskRecord,
      previousStatus: status,
      nextStatus: "assigned",
      previousAssignedTo,
      nextAssignedTo: workerPeerIdStr,
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

    if (taskRecord.state.status !== "assigned") {
      throw new TaskValidationError("Task is not assigned");
    }

    if (taskRecord.state.assignedTo !== peerIdStr) {
      throw new TaskValidationError("Task was not assigned to this worker");
    }

    const acceptanceDeadline = taskRecord.state.acceptanceDeadline;
    if (acceptanceDeadline && Math.floor(Date.now() / 1000) > acceptanceDeadline) {
      throw new TaskExpiredError("Task has expired.");
    }

    const completionWindow =
      typeof taskRecord.state.task.timeLimitSeconds === "number" &&
      taskRecord.state.task.timeLimitSeconds > 0
        ? taskRecord.state.task.timeLimitSeconds
        : TASK_ACCEPTANCE_TIME;

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "accept",
      acceptedByPeer: peerIdStr,
    });

    taskRecord.state.status = "accepted";
    taskRecord.state.acceptedBy = peerIdStr;
    taskRecord.state.completionDeadline =
      Math.floor(Date.now() / 1000) + completionWindow;

    await writeRecord({
      record: taskRecord,
      previousStatus: "assigned",
      nextStatus: "accepted",
      previousAssignedTo: taskRecord.state.assignedTo,
      nextAssignedTo: taskRecord.state.assignedTo,
    });

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
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    const status = taskRecord.state.status;
    if (status !== "assigned" && status !== "accepted") {
      throw new TaskValidationError("Task is not in a valid state to reject");
    }

    const expectedPeer =
      status === "assigned"
        ? taskRecord.state.assignedTo
        : taskRecord.state.acceptedBy;

    if (!expectedPeer || expectedPeer !== peerIdStr) {
      throw new TaskValidationError("Task was not assigned to this worker");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "reject",
      reason,
      rejectedByPeer: peerIdStr,
    });

    const previousAssignedTo = taskRecord.state.assignedTo;
    taskRecord.state.status = "rejected";
    taskRecord.state.assignedTo = undefined;
    taskRecord.state.acceptedBy = undefined;
    taskRecord.state.submissionBy = undefined;
    taskRecord.state.result = undefined;

    await writeRecord({
      record: taskRecord,
      previousStatus: status,
      nextStatus: "rejected",
      previousAssignedTo,
      nextAssignedTo: undefined,
    });

    return taskRecord;
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

    if (taskRecord.state.status !== "accepted") {
      throw new TaskValidationError("Task is not accepted");
    }

    if (taskRecord.state.acceptedBy !== peerIdStr) {
      throw new TaskValidationError("Task was not accepted by this worker");
    }

    const completionDeadline = taskRecord.state.completionDeadline;
    if (completionDeadline && Math.floor(Date.now() / 1000) > completionDeadline) {
      throw new TaskExpiredError("Task has expired.");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "submission",
      result,
      submissionByPeer: peerIdStr,
    });

    taskRecord.state.status = "submitted";
    taskRecord.state.submissionBy = peerIdStr;
    taskRecord.state.result = result;

    await writeRecord({
      record: taskRecord,
      previousStatus: "accepted",
      nextStatus: "submitted",
      previousAssignedTo: taskRecord.state.assignedTo,
      nextAssignedTo: taskRecord.state.assignedTo,
    });

    return taskRecord;
  };

  const payout = async ({
    entityId,
    payment,
  }: {
    entityId: string;
    payment: Payment;
  }): Promise<ManagerTaskRecord> => {
    const taskRecord = await getTask({ entityId });

    if (taskRecord.state.status !== "submitted") {
      throw new TaskValidationError("Task is not submitted yet");
    }

    taskRecord.events.push({
      timestamp: Math.floor(Date.now() / 1000),
      type: "payout",
      payment,
    });

    const previousAssignedTo = taskRecord.state.assignedTo;
    taskRecord.state.status = "completed";
    taskRecord.state.assignedTo = undefined;
    taskRecord.state.acceptedBy = undefined;

    await writeRecord({
      record: taskRecord,
      previousStatus: "submitted",
      nextStatus: "completed",
      previousAssignedTo,
      nextAssignedTo: taskRecord.state.submissionBy,
    });

    return taskRecord;
  };

  const listByWorker = async ({
    workerId,
    limit,
  }: {
    workerId: string;
    limit?: number;
  }) => {
    const tasks: ManagerTaskRecord[] = [];
    let count = 0;

    for await (const key of datastore.queryKeys({
      prefix: `/tasks/byWorker/${workerId}`,
    })) {
      if (limit && count >= limit) break;

      const taskId = key.toString().split("/").pop();
      if (!taskId) continue;

      const record = await coreStore.get({ entityId: `state/${taskId}` });
      if (record) {
        tasks.push(record);
        count += 1;
      }
    }

    return tasks;
  };

  const listByStatus = async ({
    status,
    limit,
  }: {
    status: TaskStatus;
    limit?: number;
  }) => {
    const tasks: ManagerTaskRecord[] = [];
    let count = 0;

    for await (const key of datastore.queryKeys({
      prefix: `/tasks/byStatus/${status}`,
    })) {
      if (limit && count >= limit) break;

      const taskId = key.toString().split("/").pop();
      if (!taskId) continue;

      const record = await coreStore.get({ entityId: `state/${taskId}` });
      if (record) {
        tasks.push(record);
        count += 1;
      }
    }

    return tasks;
  };

  return {
    ...coreStore,
    create,
    complete,
    accept,
    reject,
    payout,
    assign,
    getTask,
    listByStatus,
    listByWorker,
  };
};

export type ManagerTaskStore = ReturnType<typeof createManagerTaskStore>;
