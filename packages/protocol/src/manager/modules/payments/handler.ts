import type { PeerId } from "@libp2p/interface";
import type { pbStream } from "it-protobuf-stream";
import type { Task } from "../../../task/task.js";
import type {
	ManagerPaymentService,
	ManagerSessionService,
} from "../../modules/index.js";
import type {
	Payment,
	PayoutRequest,
	ProofRequest,
} from "../../../proto/effect.js";
import { PublicKey } from "@solana/web3.js";
import type { MessageHandler } from "../../../common/router.js";

export class PaymentMessageHandler implements MessageHandler<Payment> {
	requiresAck = false;

	async handle(
		remotePeer: PeerId,
		stream: ReturnType<typeof pbStream>,
		message: Payment,
	): Promise<void> {}
}

export class PaymentProofRequestMessageHandler
	implements MessageHandler<ProofRequest>
{
	requiresAck = true;

	async handle(
		remotePeer: PeerId,
		stream: ReturnType<typeof pbStream>,
		message: ProofRequest,
	): Promise<void> {}
}

export class PaymentPayoutRequestMessageHandler
	implements MessageHandler<PayoutRequest>
{
	constructor(
		private paymentService: ManagerPaymentService,
		private sessionService: ManagerSessionService,
	) {}

	requiresAck = true;

	async handle(
		remotePeer: PeerId,
		stream: ReturnType<typeof pbStream>,
		message: PayoutRequest,
	): Promise<Payment> {
		const { nonce, lastPayoutTimestamp, recipient } =
			await this.sessionService.getMeta(remotePeer);

		const payoutTimeInSeconds =
			Math.floor(new Date().getTime() / 1000) - lastPayoutTimestamp;

		// generate payment
		const payment = await this.paymentService.generatePayment(
			remotePeer.toString(),
			nonce,
			BigInt(payoutTimeInSeconds * 1_000_00),
			recipient,
			new PublicKey("8Ex7XokfTdr1MAMZXgN3e5eQWJ6H9u5KbnPC8CLcYgH5"),
		);

		return payment;
	}
}
