import type { Datastore } from "interface-datastore";
import { ProtoStore } from "../../../common/proto-store.js";
import { WorkerTask } from "./pb/WorkerTask.js";
import { type Task, TaskStatus } from "../../../common/proto/effect.js";
import { EventHandler, TypedEventEmitter } from "@libp2p/interface";
import { logger } from "../../../common/logging.js";

export interface WorkerTaskComponents {
	datastore: Datastore;
}

export interface WorkerTaskEvents {
	"task:received": CustomEvent<WorkerTask>;
	"task:completed": CustomEvent<Task>;
}

export class WorkerTaskService extends TypedEventEmitter<WorkerTaskEvents> {
	private readonly store: ProtoStore<WorkerTask>;

	constructor(private components: WorkerTaskComponents) {
		super();
		this.store = new ProtoStore<WorkerTask>(this.components, {
			prefix: "tasks",
			encoder: WorkerTask.encode,
			decoder: WorkerTask.decode,
		});
	}

	public async onIncomingTask(task: Task, managerId: string) {
		logger.info(`WORKER: Received task from manager ${managerId}`);

		const result = await this.store.put(task.taskId, {
			task,
			assignment: {
				managerId,
				assignedAt: new Date().toString(),
			},
		});

		this.safeDispatchEvent("task:received", { detail: { task } });

		return result;
	}

	//TODO:: manager also has this function, should be moved to a common service
	public async updateTaskStatus(
		workerTask: WorkerTask,
		status: TaskStatus,
		updatedAt: string = new Date().toISOString(),
	): Promise<NonNullable<WorkerTask>> {
		if (!workerTask.task || !workerTask.assignment) {
			throw new Error("ManagerTask validation error.");
		}

		switch (status) {
			case TaskStatus.PENDING:
				break;
			case TaskStatus.ASSIGNED:
				if (workerTask.task.status !== TaskStatus.PENDING) {
					throw new Error("Task can only be assigned if it is pending.");
				}
				workerTask.assignment.assignedAt = updatedAt;
				break;
			case TaskStatus.REJECTED:
				if (workerTask.task.status !== TaskStatus.ASSIGNED) {
					throw new Error("Task can only be rejected if it is assigned.");
				}
				workerTask.assignment.rejectedAt = updatedAt;
				break;
			case TaskStatus.ACCEPTED:
				if (workerTask.task.status !== TaskStatus.ASSIGNED) {
					throw new Error("Task can only be rejected if it is assigned.");
				}
				workerTask.assignment.acceptedAt = updatedAt;
				break;
			case TaskStatus.COMPLETED:
				if (workerTask.task.status !== TaskStatus.ACCEPTED) {
					throw new Error("Task can only be completed if it is accepted.");
				}
				workerTask.assignment.completedAt = updatedAt;
				break;
			default:
				throw new Error("Invalid task status transition.");
		}

		workerTask.task.status = status;

		return workerTask;
	}

	public async acceptTask(taskId: string) {
		const workerTask = await this.store.get(taskId);
		await this.updateTaskStatus(workerTask, TaskStatus.ACCEPTED);
		await this.store.put(taskId, workerTask);
		return workerTask;
	}

	public async rejectTask(taskId: string) {
		const workerTask = await this.store.get(taskId);
		await this.updateTaskStatus(workerTask, TaskStatus.REJECTED);
		await this.store.put(taskId, workerTask);
		return workerTask;
	}

	public async completeTask(taskId: string, result: string) {
		const workerTask = await this.store.get(taskId);
		if (!workerTask.task) {
			throw new Error("Task not found.");
		}

		workerTask.task.result = result;
		await this.updateTaskStatus(workerTask, TaskStatus.COMPLETED);
		await this.store.put(taskId, workerTask);

		return workerTask;
	}
}
