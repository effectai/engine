import type { PeerId, TypedEventTarget } from "@libp2p/interface";
import type { MessageStream } from "it-protobuf-stream";
import type {
	EffectProtocolMessage,
	Payment,
} from "../../../../common/proto/effect.js";
import type { WorkerPaymentService } from "./../service.js";
import type {
	WorkerMessageHandler,
	WorkerProtocolEvents,
} from "../../../worker.js";

export class PaymentMessageHandler implements WorkerMessageHandler<Payment> {
	constructor(private paymentService: WorkerPaymentService) {}

	async handle({
		message,
		events,
	}: {
		remotePeer: PeerId;
		stream: MessageStream<EffectProtocolMessage>;
		events: TypedEventTarget<WorkerProtocolEvents>;
		message: Payment;
	}): Promise<void> {
		console.log("received payment", message);
		await this.paymentService.onReceivePayment({ payment: message });
		events.safeDispatchEvent("payment:received", { detail: message });
	}
}
