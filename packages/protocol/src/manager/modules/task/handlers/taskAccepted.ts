import type { PeerId } from "@libp2p/interface";
import type { MessageStream } from "it-protobuf-stream";
import { logger } from "../../../../common/logging.js";
import type {
	TaskAccepted,
	EffectProtocolMessage,
} from "../../../../common/proto/effect.js";
import type { MessageHandler } from "../../../../common/router.js";
import type { ManagerTaskService } from "../service.js";

export class TaskAcceptedMessageHandler
	implements MessageHandler<TaskAccepted>
{
	constructor(private taskService: ManagerTaskService) {}
	requiresAck = false;

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: TaskAccepted,
	): Promise<void> {
		logger.info(`MANAGER: Task accepted by ${remotePeer.toString()}`);
		await this.taskService.setTaskAccepted(message.taskId, message.timestamp);
	}
}
