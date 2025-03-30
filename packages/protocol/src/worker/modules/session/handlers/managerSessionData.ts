import type { PeerId } from "@libp2p/interface";
import type { MessageStream, pbStream } from "it-protobuf-stream";
import type {
	EffectProtocolMessage,
	ManagerSessionData,
} from "../../../../proto/effect.js";
import { logger } from "../../../../common/logging.js";
import type { WorkerSession } from "../../../worker.js";
import { MessageHandler } from "../../../../common/router.js";

export class ManagerSessionDataHandler
	implements MessageHandler<ManagerSessionData>
{
	requiresAck = true;

	constructor(
		private peerId: PeerId,
		private onPair?: (
			peerId: string,
			pubX: Uint8Array,
			pubY: Uint8Array,
		) => Promise<WorkerSession>,
	) {}

	async handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: ManagerSessionData,
	): Promise<void> {
		logger.info("WORKER: handling manager session data");

		if (!this.onPair) {
			throw new Error("onPair is not defined");
		}

		const { nonce, recipient } = await this.onPair(
			remotePeer.toString(),
			message.pubX,
			message.pubY,
		);

		//Send a worker session message back to the manager
		const workerSessionMessage: EffectProtocolMessage = {
			workerSession: {
				id: this.peerId.toString(),
				recipient: recipient.toBuffer(),
				nonce: nonce,
			},
		};

		await stream.write(workerSessionMessage);
	}
}
