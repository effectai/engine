import type { Libp2pEvents, PeerId, TypedEventTarget } from "@libp2p/interface";
import type { MessageStream } from "it-protobuf-stream";
import type { MessageHandler } from "../../../../common/router.js";
import type { EffectProtocolMessage } from "../../../../common/proto/effect.js";
import type { Task } from "../pb/WorkerTask.js";
import type { WorkerTaskService } from "../service.js";
import type {
	WorkerMessageHandler,
	WorkerProtocolEvents,
} from "../../../worker.js";

export class TaskMessageHandler implements WorkerMessageHandler<Task> {
	constructor(private taskService: WorkerTaskService) {}

	async handle({
		remotePeer,
		stream,
		events,
		message,
	}: {
		remotePeer: PeerId;
		stream: MessageStream<EffectProtocolMessage>;
		events: TypedEventTarget<WorkerProtocolEvents>;
		message: Task;
	}): Promise<void> {
		await this.taskService.onIncomingTask(message, remotePeer.toString());
		events.safeDispatchEvent("task:received", { detail: message });
	}
}
