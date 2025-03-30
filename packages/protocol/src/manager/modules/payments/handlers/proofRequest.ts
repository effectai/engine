import type { PeerId } from "@libp2p/interface";
import type { MessageStream, pbStream } from "it-protobuf-stream";
import type {
	EffectProtocolMessage,
	ProofRequest,
} from "../../../../common/proto/effect.js";
import type { MessageHandler } from "../../../../common/router.js";
import type { ManagerPaymentService } from "../service.js";

export class PaymentProofRequestMessageHandler
	implements MessageHandler<ProofRequest>
{
	constructor(private paymentService: ManagerPaymentService) {}

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: ProofRequest,
	): Promise<void> {
		console.log("Received payment proof request:", message);

		const { proof, publicSignals, pubKey } =
			await this.paymentService.generatePaymentProof(message.payments);

		const msg: EffectProtocolMessage = {
			proofResponse: {
				r8: {
					R8_1: pubKey[0],
					R8_2: pubKey[1],
				},
				signals: {
					minNonce: publicSignals[0],
					maxNonce: publicSignals[1],
					amount: BigInt(publicSignals[2]),
				},
				piA: proof.pi_a,
				piB: [
					{ row: [proof.pi_b[0][0], proof.pi_b[0][1]] },
					{ row: [proof.pi_b[1][0], proof.pi_b[1][1]] },
					{ row: [proof.pi_b[2][0], proof.pi_b[2][1]] },
				],
				piC: proof.pi_c,
				protocol: proof.protocol,
				curve: proof.curve,
			},
		};

		try {
			await stream.write(msg);
		} catch (e) {
			console.error("Error sending payment proof response", e);
		}
	}
}
