import type { PeerId } from "@libp2p/interface";
import type { ActionHandler } from "../../../../common/router.js";
import type {
	EffectProtocolMessage,
	Task,
} from "../../../../common/proto/effect.js";
import type { WorkerSessionService } from "../../session/service.js";
import type { WorkerTaskService } from "./../service.js";
import type { WorkerTask } from "../pb/WorkerTask.js";

export class GetTasksAction implements ActionHandler<void, WorkerTask[]> {
	constructor(private taskService: WorkerTaskService) {}

	async execute(): Promise<WorkerTask[]> {
		try {
			return await this.taskService.getTasks();
		} catch (error) {
			console.error("Error getting tasks:", error);
			throw error;
		}
	}
}
