import { logger } from "../../../../common/logging.js";
import { Task, TaskStatus } from "../../../../common/proto/effect.js";
import type { ActionHandler } from "../../../../common/router.js";
import type { ManagerSessionService } from "../../session/service.js";
import type { ManagerTaskService } from "../service.js";

export type ManageTaskParams = {
	taskId: string;
};

export class ManageTaskAction implements ActionHandler<ManageTaskParams, void> {
	constructor(
		private taskService: ManagerTaskService,
		private sessionService: ManagerSessionService,
	) {}

	async execute(params: ManageTaskParams): Promise<void> {
		try {
			const { taskId } = params;

			logger.info("Managing task with ID:", taskId);

			//get the task from the taskStore
			const managerTask = await this.taskService.getTask(taskId);

			if (!managerTask?.task) {
				throw new Error("Task not found");
			}

			switch (managerTask.task.status) {
				case TaskStatus.PENDING: {
					const workerPeerId = await this.sessionService.dequeueWorker();

					if (!workerPeerId) {
						throw new Error("No available worker to assign the task");
					}

					await this.taskService.assignTask(managerTask, workerPeerId);

					await this.sessionService.sendMessage(workerPeerId, {
						task: managerTask.task,
					});
					break;
				}
				case TaskStatus.ASSIGNED:
					//check for task assignment expiration
					break;
				case TaskStatus.ACCEPTED:
					//check for task acceptance expiration
					break;
				case TaskStatus.COMPLETED:
					//handle completed task
					break;
				case TaskStatus.REJECTED:
					//handle failed task
					break;
				default:
					throw new Error("Unknown task status");
			}
		} catch (e) {
			console.error(e);
		}
	}
}
