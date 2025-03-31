import { logger } from "../../../../common/logging.js";
import { Task, TaskStatus } from "../../../../common/proto/effect.js";
import type { ActionHandler } from "../../../../common/router.js";
import type { ManagerSessionService } from "../../session/service.js";
import { ManagerTask } from "../pb/ManagerTask.js";
import type { ManagerTaskService } from "../service.js";
import { ManageTaskAction } from "./manageTask.js";

export class GetTasksAction implements ActionHandler<void, ManagerTask[]> {
	constructor(private taskService: ManagerTaskService) {}

	async execute(): Promise<ManagerTask[]> {
		try {
			return await this.taskService.getTasks();
		} catch (e) {
			console.error(e);
			return [];
		}
	}
}
