import type { PeerId } from "@libp2p/interface";
import type { ActionHandler } from "../../../../common/router.js";
import type {
	EffectProtocolMessage,
	Payment,
	ProofRequest,
	ProofResponse,
} from "../../../../common/proto/effect.js";
import type { WorkerSessionService } from "../../session/service.js";

export type RequestProofActionParams = {
	managerPeer: PeerId;
	payments: Payment[];
};

export type RequestProofActionResult = ProofResponse;

export class RequestPaymentProof
	implements ActionHandler<RequestProofActionParams, RequestProofActionResult>
{
	constructor(
		private peerId: PeerId,
		private sessionService: WorkerSessionService,
	) {}

	async execute(
		params: RequestProofActionParams,
	): Promise<RequestProofActionResult> {
		try {
			const message: EffectProtocolMessage = {
				proofRequest: {
					batchSize: params.payments.length,
					payments: params.payments,
				},
			};

			const reply = (await this.sessionService.sendManagerMessage(
				params.managerPeer.toString(),
				message,
				true,
			)) as ProofResponse;

			return reply;
		} catch (e) {
			console.error(e);
			throw new Error("Failed to request proof");
		}
	}
}
