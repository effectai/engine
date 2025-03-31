import type { PeerId, TypedEventTarget } from "@libp2p/interface";
import type { MessageStream } from "it-protobuf-stream";
import { logger } from "../../../../common/logging.js";
import type {
	TaskAccepted,
	EffectProtocolMessage,
} from "../../../../common/proto/effect.js";
import type { ManagerTaskService } from "../service.js";
import type {
	ManagerMessageHandler,
	ManagerProtocolEvents,
} from "../../../manager.js";

export class TaskAcceptedMessageHandler
	implements ManagerMessageHandler<TaskAccepted>
{
	constructor(private taskService: ManagerTaskService) {}

	async handle({
		remotePeer,
		stream,
		events,
		message,
	}: {
		remotePeer: PeerId;
		stream: MessageStream<EffectProtocolMessage>;
		events: TypedEventTarget<ManagerProtocolEvents>;
		message: TaskAccepted;
	}): Promise<void> {
		await this.taskService.setTaskAccepted(message.taskId, message.timestamp);
	}
}
