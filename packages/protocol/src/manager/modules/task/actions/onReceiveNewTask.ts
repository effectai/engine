import type { Task } from "../../../../common/proto/effect.js";
import type { ActionHandler } from "../../../../common/router.js";
import type { ManagerTaskService } from "../service.js";

export type onReceiveNewTaskParams = {
	task: Task;
};

export class OnReceiveNewTaskAction
	implements ActionHandler<onReceiveNewTaskParams, void>
{
	constructor(private taskService: ManagerTaskService) {}

	async execute(params: onReceiveNewTaskParams): Promise<void> {
		try {
			const { task } = params;
			console.log(task);

			// we save the task in our task store.
			await this.taskService.onIncomingTask(task);
		} catch (e) {
			console.error(e);
			throw new Error("Failed to process task");
		}
	}
}
