import { ManagerTask } from "../manager/modules/task/pb/ManagerTask.js";
import { WorkerTask } from "../worker/index.js";
import { WorkerAssignment } from "../worker/modules/task/pb/WorkerTask.js";
import { TaskExpiredError } from "./errors.js";
import { Task, TaskAssignment, TaskStatus } from "./proto/effect.js";

type TaskEntity = {
	task: { status: TaskStatus };
	assignment?: { [key: string]: number };
	workerAssignment?: { [key: string]: number }[];
};

export const isTaskExpired = (startsAt: number, timeLimit: number) => {
	const now = Math.floor(new Date().getTime() / 1000);
	const expiresAt = startsAt + timeLimit;
	return now > expiresAt;
};

export function updateTaskStatus(
	task: Task,
	assignment: TaskAssignment,
	status: TaskStatus,
	updatedAt: number = Math.floor(new Date().getTime() / 1000),
): Task {
	switch (status) {
		case TaskStatus.PENDING:
			break;
		case TaskStatus.ASSIGNED:
			if (task.status !== TaskStatus.PENDING) {
				throw new Error("Task can only be assigned if it is pending.");
			}
			assignment.assignedAt = updatedAt;
			break;
		case TaskStatus.REJECTED:
			if (task.status !== TaskStatus.ASSIGNED) {
				throw new Error("Task can only be rejected if it is assigned.");
			}
			assignment.rejectedAt = updatedAt;
			break;
		case TaskStatus.ACCEPTED:
			if (task.status !== TaskStatus.ASSIGNED) {
				throw new Error("Task can only be accepted if it is assigned.");
			}
			assignment.acceptedAt = updatedAt;
			break;
		case TaskStatus.COMPLETED:
			if (task.status !== TaskStatus.ACCEPTED) {
				throw new Error("Task can only be completed if it is accepted.");
			}
			assignment.completedAt = updatedAt;
			break;
		default:
			throw new Error("Invalid task status transition.");
	}

	// Update the task status
	task.status = status;
	return task;
}

export const markTaskAsCompleted = async (
	task: Task,
	assignment: TaskAssignment,
	result: string,
): Promise<void> => {
	if (!assignment || !assignment.acceptedAt) {
		throw new Error("Assignment not found or not accepted.");
	}

	if (isTaskExpired(assignment.acceptedAt, task.timeLimitSeconds)) {
		throw new TaskExpiredError("Task has expired, cannot complete.");
	}

	task.result = result;

	updateTaskStatus(
		task,
		assignment,
		TaskStatus.COMPLETED,
		Math.floor(new Date().getTime() / 1000),
	);
};

export const markTaskAsAccepted = async (
	task: Task,
	assignment: TaskAssignment,
): Promise<void> => {
	if (!assignment || !assignment.assignedAt) {
		throw new Error("Assignment not found or not assigned.");
	}

	//TODO:: hardcoded as 600 seconds for now to accept a task.
	if (isTaskExpired(assignment.assignedAt, 600)) {
		throw new TaskExpiredError("Task has expired, cannot accept.");
	}

	updateTaskStatus(
		task,
		assignment,
		TaskStatus.ACCEPTED,
		Math.floor(new Date().getTime() / 1000),
	);
};

export const markTaskAsRejected = async (
	task: Task,
	assignment: TaskAssignment,
): Promise<void> => {
	if (!assignment || !assignment.assignedAt) {
		throw new Error("Assignment not found or not assigned.");
	}

	updateTaskStatus(
		task,
		assignment,
		TaskStatus.REJECTED,
		Math.floor(new Date().getTime() / 1000),
	);
};

export const markTaskAsAssigned = async (
	peerId: string,
	task: Task,
): Promise<{
	assignment: TaskAssignment;
}> => {
	const assignment: TaskAssignment = {
		peerId,
		assignedAt: Math.floor(new Date().getTime() / 1000),
	};

	updateTaskStatus(
		task,
		assignment,
		TaskStatus.ASSIGNED,
		Math.floor(new Date().getTime() / 1000),
	);

	return { assignment };
};

export const selectAssignment = (
	workerAssignments: TaskAssignment[],
	peerId: string,
): TaskAssignment => {
	const assignment = workerAssignments.find(
		(assignment) => assignment.peerId === peerId,
	);

	if (!assignment) {
		throw new Error(`Assignment not found for peer ID: ${peerId}`);
	}

	return assignment;
};
