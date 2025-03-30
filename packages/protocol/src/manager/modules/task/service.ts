import { type Datastore, Key } from "interface-datastore";
import type { ManagerPaymentService } from "../payments/service.js";
import type { PeerId, PeerStore, PrivateKey } from "@libp2p/interface";
import type { ConnectionManager } from "@libp2p/interface-internal";
import { TaskStatus } from "../../../common/proto/task/task.js";
import type { WorkerQueue } from "../../queue.js";
import { ManagerTask } from "./pb/ManagerTask.js";
import { ProtoStore } from "../../../common/proto-store.js";
import { logger } from "../../../common/logging.js";

export interface ManagerTaskServiceComponents {
	connectionManager: ConnectionManager;
	peerStore: PeerStore;
	privateKey: PrivateKey;
	datastore: Datastore;
}

export class ManagerTaskService {
	private readonly store: ProtoStore<ManagerTask>;

	constructor(private components: ManagerTaskServiceComponents) {
		this.store = new ProtoStore<ManagerTask>(this.components, {
			prefix: "tasks",
			encoder: ManagerTask.encode,
			decoder: ManagerTask.decode,
		});
	}

	public async onIncomingTask(
		task: NonNullable<ManagerTask["task"]>,
	): Promise<ManagerTask> {
		//ensure our task is not in store yet..
		if (await this.store.has(task.taskId)) {
			throw new Error(`Task with ID ${task.taskId} already exists.`);
		}

		const managerTask: ManagerTask = {
			task: task,
			workerAssignment: [],
		};

		this.store.put(task.taskId, managerTask);

		return managerTask;
	}

	public async getTasks(): Promise<ManagerTask[]> {
		return this.store.all();
	}

	public async getTask(taskId: string): Promise<ManagerTask | undefined> {
		const task = await this.store.get(taskId);

		if (!task) {
			throw new Error(`Task with ID ${taskId} not found.`);
		}

		return task;
	}

	public async updateTaskStatus(
		managerTask: ManagerTask,
		status: TaskStatus,
		updatedAt: string = new Date().toISOString(),
	): Promise<NonNullable<ManagerTask>> {
		if (!managerTask.task || !managerTask.workerAssignment) {
			throw new Error("ManagerTask validation error.");
		}

		const totalWorkerAssignments = managerTask.workerAssignment.length;

		switch (status) {
			case TaskStatus.PENDING:
				break;
			case TaskStatus.ASSIGNED:
				if (managerTask.task.status !== TaskStatus.PENDING) {
					throw new Error("Task can only be assigned if it is pending.");
				}
				managerTask.workerAssignment[totalWorkerAssignments - 1].assignedAt =
					updatedAt;
				break;
			case TaskStatus.REJECTED:
				if (managerTask.task.status !== TaskStatus.ASSIGNED) {
					throw new Error("Task can only be rejected if it is assigned.");
				}
				managerTask.workerAssignment[totalWorkerAssignments - 1].rejectedAt =
					updatedAt;
				break;
			case TaskStatus.ACCEPTED:
				if (managerTask.task.status !== TaskStatus.ASSIGNED) {
					throw new Error("Task can only be rejected if it is assigned.");
				}
				managerTask.workerAssignment[totalWorkerAssignments - 1].acceptedAt =
					updatedAt;
				break;
			case TaskStatus.COMPLETED:
				if (managerTask.task.status !== TaskStatus.ACCEPTED) {
					throw new Error("Task can only be completed if it is accepted.");
				}
				managerTask.workerAssignment[totalWorkerAssignments - 1].completedAt =
					updatedAt;
				break;
			default:
				throw new Error("Invalid task status transition.");
		}

		managerTask.task.status = status;

		return managerTask;
	}

	public async assignTask(
		managerTask: ManagerTask,
		worker: PeerId,
	): Promise<ManagerTask> {
		managerTask.workerAssignment.push({
			workerId: worker.toString(),
			assignedAt: new Date().toISOString(),
		});

		if (!managerTask.task) {
			throw new Error("Task not found.");
		}

		await this.updateTaskStatus(managerTask, TaskStatus.ASSIGNED);
		await this.store.put(managerTask.task.taskId, managerTask);

		return managerTask;
	}

	public async setTaskAccepted(
		taskId: string,
		timestamp: string,
	): Promise<ManagerTask> {
		const managerTask = await this.store.get(taskId);

		await this.updateTaskStatus(managerTask, TaskStatus.ACCEPTED, timestamp);
		await this.store.put(taskId, managerTask);

		return managerTask;
	}

	public async setTaskRejected(taskId: string): Promise<boolean> {
		const managerTask = await this.store.get(taskId);

		await this.updateTaskStatus(managerTask, TaskStatus.REJECTED);
		await this.store.put(taskId, managerTask);

		return true;
	}

	public async setTaskCompleted(
		taskId: string,
		result: string,
	): Promise<boolean> {
		const managerTask = await this.store.get(taskId);

		if (!managerTask?.task) {
			throw new Error(`Task with ID ${taskId} not found.`);
		}

		// update status & set result.
		await this.updateTaskStatus(managerTask, TaskStatus.COMPLETED);
		managerTask.task.result = result;

		await this.store.put(taskId, managerTask);

		return true;
	}

	//
	// public async manageTask(task: Task) {
	// 	task.manager = this.components.peerId.toString();
	//
	// 	await this.taskService.storeTask(task);
	// 	//get worker from queue
	// 	const worker = this.workerQueue.dequeue();
	//
	// 	if (!worker) {
	// 		console.error("No worker available");
	// 		return;
	// 	}
	//
	// 	//send task to worker
	// 	const taskMessage: WorkerMessage = {
	// 		task: task,
	// 	};
	//
	// 	return this.sendWorkerMessage(worker, taskMessage);
	// }
}
