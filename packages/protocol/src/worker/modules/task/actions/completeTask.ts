import type { PeerId } from "@libp2p/interface";
import type { ActionHandler } from "../../../../common/router.js";
import type { EffectProtocolMessage } from "../../../../common/proto/effect.js";
import type { WorkerSessionService } from "../../session/service.js";
import type { WorkerTaskService } from "./../service.js";

export interface CompleteTaskActionParams {
	taskId: string;
	result: Record<string, string | number | bigint>;
}

export class CompleteTaskAction
	implements ActionHandler<CompleteTaskActionParams, void>
{
	constructor(
		private peerId: PeerId,
		private taskService: WorkerTaskService,
		private sessionService: WorkerSessionService,
	) {}

	async execute(params: CompleteTaskActionParams): Promise<void> {
		const { taskId, result } = params;
		try {
			const { assignment } = await this.taskService.completeTask(
				taskId,
				result,
			);

			if (!assignment) {
				console.error("No assignment found for task:", taskId);
				return;
			}

			const message: EffectProtocolMessage = {
				taskCompleted: {
					taskId: taskId,
					worker: this.peerId.toString(),
					result: result,
					timestamp: new Date().toString(),
				},
			};

			await this.sessionService.sendManagerMessage(
				assignment?.managerId,
				message,
			);
		} catch (error) {
			console.error("Error completing task:", error);
		}
	}
}
