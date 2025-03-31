import { logger } from "../../../../common/logging.js";
import { Task, TaskStatus } from "../../../../common/proto/effect.js";
import type { ActionHandler } from "../../../../common/router.js";
import type { ManagerSessionService } from "../../session/service.js";
import type { ManagerTaskService } from "../service.js";
import { ManageTaskAction } from "./manageTask.js";

export class ManageTasksAction implements ActionHandler<void, void> {
	constructor(
		private taskService: ManagerTaskService,
		private sessionService: ManagerSessionService,
	) {}

	async execute(): Promise<void> {
		try {
			const managerTasks = await this.taskService.getTasks();

			const action = new ManageTaskAction(
				this.taskService,
				this.sessionService,
			);

			for (const managerTask of managerTasks) {
				if (!managerTask.task) {
					throw new Error("Task not found");
				}

				await action.execute({
					taskId: managerTask.task.taskId,
				});
			}
		} catch (e) {
			console.error(e);
		}
	}
}
