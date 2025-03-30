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
	implements ActionHandler<RequestPayoutActionParams, void>
{
	constructor(
		private peerId: PeerId,
		private sessionService: WorkerSessionService,
	) {}

	async execute(params: RequestPayoutActionParams): Promise<void> {
		const { managerPeer } = params;

		try {
			console.log("executing request payout action...");

			const message: EffectProtocolMessage = {
				payoutRequest: {
					peerId: this.peerId.toString(),
				},
			};

			const result = await this.sessionService.sendManagerMessage(
				managerPeer.toString(),
				message,
				true,
			);
		} catch (e) {
			console.error(e);
		}
	}
}
