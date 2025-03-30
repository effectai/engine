import type { PeerId } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import type { MessageStream, pbStream } from "it-protobuf-stream";
import type { MessageHandler } from "../../../../common/router.js";
import type {
	PayoutRequest,
	Payment,
	EffectProtocolMessage,
} from "../../../../common/proto/effect.js";
import type { ManagerSessionService } from "../../session/service.js";
import type { ManagerPaymentService } from "../service.js";

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
		stream: MessageStream<EffectProtocolMessage>,
		message: PayoutRequest,
	): Promise<void> {
		const { nonce, lastPayoutTimestamp, recipient } =
			await this.sessionService.getMeta(remotePeer);

		if (!lastPayoutTimestamp) {
			throw new Error("lastPayoutTimestamp is not set");
		}

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

		// update worker nonce
		await this.sessionService.setNonce(remotePeer, BigInt(nonce + 1n));

		// update last payout time
		await this.sessionService.setLastPayoutTimestamp(
			remotePeer,
			Math.floor(new Date().getTime() / 1000).toString(),
		);

		//TODO:: save this payment to the store for future resends

		const msg: EffectProtocolMessage = {
			payment,
		};

		// send payment
		await stream.write(msg);
	}
}
