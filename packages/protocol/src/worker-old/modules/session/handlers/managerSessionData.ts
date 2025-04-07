import type { Libp2pEvents, PeerId, TypedEventTarget } from "@libp2p/interface";
import type { MessageStream, pbStream } from "it-protobuf-stream";
import type {
	EffectProtocolMessage,
	ManagerSessionData,
} from "../../../../common/proto/effect.js";
import { logger, workerLogger } from "../../../../common/logging.js";
import type { WorkerSession } from "../service.js";
import type {
	WorkerMessageHandler,
	WorkerProtocolEvents,
} from "../../../worker.js";

export class ManagerSessionDataHandler
	implements WorkerMessageHandler<ManagerSessionData>
{
	constructor(
		private peerId: PeerId,
		private onPair?: (
			peerId: string,
			pubX: Uint8Array,
			pubY: Uint8Array,
		) => Promise<WorkerSession>,
	) {}

	async handle({
		remotePeer,
		stream,
		events,
		message,
	}: {
		remotePeer: PeerId;
		stream: MessageStream<EffectProtocolMessage>;
		events: TypedEventTarget<WorkerProtocolEvents>;
		message: ManagerSessionData;
	}): Promise<void> {
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

		workerLogger.info(
			{ nonce, recipient: recipient.toString() },
			"sending session message to manager",
		);

		await stream.write(workerSessionMessage);
	}
}
