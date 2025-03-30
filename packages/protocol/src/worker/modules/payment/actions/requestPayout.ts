import type { PeerId } from "@libp2p/interface";
import type { ActionHandler } from "../../../../common/router.js";
import type {
	EffectProtocolMessage,
	Payment,
} from "../../../../proto/effect.js";
import type { WorkerSessionService } from "../../session/service.js";

export type RequestPayoutActionParams = {
	managerPeer: PeerId;
};

export type RequestPayoutActionResult = {
	payment: Payment;
};

export class RequestPayoutAction
	implements ActionHandler<RequestPayoutActionParams, Payment>
{
	constructor(
		private peerId: PeerId,
		private sessionService: WorkerSessionService,
	) {}

	async execute(params: RequestPayoutActionParams): Promise<Payment> {
		try {
			const { managerPeer } = params;

			const message: EffectProtocolMessage = {
				payoutRequest: {
					peerId: this.peerId.toString(),
				},
			};

			return (await this.sessionService.sendManagerMessage(
				managerPeer.toString(),
				message,
				true,
			)) as Promise<Payment>;
		} catch (e) {
			console.error(e);
			throw new Error("Failed to request payout");
		}
	}
}
