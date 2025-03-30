import type { PeerId } from "@libp2p/interface";
import type {
	EffectProtocolMessage,
	Task,
	TaskAccepted,
	TaskCompleted,
	TaskRejected,
} from "../../../proto/effect.js";
import type { MessageStream, pbStream } from "it-protobuf-stream";
import type {
	ManagerPaymentService,
	ManagerSessionService,
	ManagerTaskService,
} from "../../modules/index.js";
import { logger } from "../../../common/logging.js";
import type { MessageHandler } from "../../../common/router.js";
import { PublicKey } from "@solana/web3.js";

export class TaskMessageHandler implements MessageHandler<Task> {
	requiresAck = true;

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<Task>,
		message: Task,
	): Promise<void> {}
}

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

export class TaskRejectedMessageHandler
	implements MessageHandler<TaskRejected>
{
	requiresAck = false;

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: TaskRejected,
	): Promise<void> {}
}

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
