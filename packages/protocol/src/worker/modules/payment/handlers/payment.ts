import type { PeerId } from "@libp2p/interface";
import type { MessageStream } from "it-protobuf-stream";
import type { MessageHandler } from "../../../../common/router.js";
import type {
	EffectProtocolMessage,
	Payment,
} from "../../../../proto/effect.js";
import type { WorkerPaymentService } from "./../service.js";

export class PaymentMessageHandler implements MessageHandler<Payment> {
	constructor(private paymentService: WorkerPaymentService) {}

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: Payment,
	): Promise<void> {
		await this.paymentService.onReceivePayment(message);
	}
}
