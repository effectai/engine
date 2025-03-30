import type { PeerId } from "@libp2p/interface";
import type { MessageStream } from "it-protobuf-stream";
import type { MessageHandler } from "../../../../common/router.js";
import type { EffectProtocolMessage } from "../../../../proto/effect.js";
import type { Task } from "../pb/WorkerTask.js";
import type { WorkerTaskService } from "../service.js";

export class TaskMessageHandler implements MessageHandler<Task> {
	constructor(private taskService: WorkerTaskService) {}

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: Task,
	): Promise<void> {
		await this.taskService.onIncomingTask(message, remotePeer.toString());
	}
}
