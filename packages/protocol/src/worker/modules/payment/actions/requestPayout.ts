import type { PeerId } from "@libp2p/interface";
import type { ActionHandler } from "../../../../common/router.js";
import type {
	EffectProtocolMessage,
	Payment,
} from "../../../../common/proto/effect.js";
import type { WorkerSessionService } from "../../session/service.js";
import { logger } from "../../../../common/logging.js";
import { WorkerPaymentService } from "../service.js";

export type RequestPayoutActionParams = {
	managerPeer: PeerId;
};

export type RequestPayoutActionResult = {
	payment: Payment;
};

export class RequestPayoutAction
	implements ActionHandler<RequestPayoutActionParams, RequestPayoutActionResult>
{
	constructor(
		private peerId: PeerId,
		private sessionService: WorkerSessionService,
		private paymentService: WorkerPaymentService,
	) {}

	async execute(
		params: RequestPayoutActionParams,
	): Promise<RequestPayoutActionResult> {
		try {
			const { managerPeer } = params;

			const message: EffectProtocolMessage = {
				payoutRequest: {
					peerId: this.peerId.toString(),
				},
			};

			const payment = (await this.sessionService.sendManagerMessage(
				managerPeer.toString(),
				message,
				true,
			)) as Payment;

			logger.info(payment, "WORKER: Received payment");

			//store the payment
			await this.paymentService.onReceivePayment(payment);

			return {
				payment,
			};
		} catch (e) {
			console.error(e);
			throw new Error("Failed to request payout");
		}
	}
}
