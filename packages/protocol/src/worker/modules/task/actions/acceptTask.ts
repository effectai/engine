import type { PeerId } from "@libp2p/interface";
import type { ActionHandler } from "../../../../common/router.js";
import type { EffectProtocolMessage } from "../../../../common/proto/effect.js";
import type { WorkerSessionService } from "../../session/service.js";
import type { WorkerTaskService } from "./../service.js";

export interface AcceptTaskActionParams {
	taskId: string;
}

export class AcceptTaskAction
	implements ActionHandler<AcceptTaskActionParams, void>
{
	constructor(
		private peerId: PeerId,
		private taskService: WorkerTaskService,
		private sessionService: WorkerSessionService,
	) {}

	async execute(params: AcceptTaskActionParams): Promise<void> {
		const { taskId } = params;

		try {
			const { assignment } = await this.taskService.acceptTask(taskId);

			if (!assignment) {
				console.error("No assignment found for task:", taskId);
				return;
			}

			const message: EffectProtocolMessage = {
				taskAccepted: {
					taskId: taskId,
					worker: this.peerId.toString(),
					timestamp: new Date().toString(),
				},
			};

			this.sessionService.sendManagerMessage(assignment?.managerId, message);
		} catch (error) {
			console.error("Error accepting task:", error);
		}
	}
}
