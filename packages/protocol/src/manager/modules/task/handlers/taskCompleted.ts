import type { PeerId } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import type { MessageStream } from "it-protobuf-stream";
import { logger } from "../../../../common/logging.js";
import type {
	TaskCompleted,
	EffectProtocolMessage,
} from "../../../../common/proto/effect.js";
import type { MessageHandler } from "../../../../common/router.js";
import type { ManagerPaymentService } from "../../payments/service.js";
import type { ManagerSessionService } from "../../session/service.js";
import type { ManagerTaskService } from "../service.js";

export class TaskCompletedMessageHandler
	implements MessageHandler<TaskCompleted>
{
	constructor(
		private paymentService: ManagerPaymentService,
		private taskService: ManagerTaskService,
		private sessionService: ManagerSessionService,
	) {}

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: TaskCompleted,
	): Promise<void> {
		logger.info(`MANAGER: Task completed by ${remotePeer.toString()}`);
		const task = await this.taskService.getTask(message.taskId);

		await this.taskService.setTaskCompleted(message.taskId, message.result);

		const { nonce, recipient } = await this.sessionService.retrieveWorkerMeta(
			remotePeer.toString(),
		);

		if (!task?.task?.reward) {
			logger.error("Task has no reward");
			return;
		}

		const payment = await this.paymentService.generatePayment(
			remotePeer.toString(),
			nonce,
			task.task.reward,
			recipient,
			//TODO:: get payment account..
			new PublicKey("3pJUvyH1t4dBTyz622epbKkVYELVFk9hB5kU6Kmp3ien"),
		);

		//send payment
		const msg: EffectProtocolMessage = {
			payment,
		};

		await this.sessionService.sendMessage(remotePeer.toString(), msg);
	}
}
