import { pbStream } from "it-protobuf-stream";
import {
	MULTICODEC_MANAGER_PROTOCOL_NAME,
	MULTICODEC_MANAGER_PROTOCOL_VERSION,
} from "../../../manager/consts.js";
import { EffectProtocolMessage } from "../../../proto/effect.js";
import { getOrCreateActiveOutBoundStream } from "../../../utils/utils.js";
import type { WorkerProtocolComponents } from "../../worker.js";

export class WorkerSessionService {
	constructor(private components: WorkerProtocolComponents) {}

	async sendManagerMessage(
		peerId: string,
		message: EffectProtocolMessage,
		expectReply = false,
	): Promise<EffectProtocolMessage | undefined> {
		try {
			const stream = await getOrCreateActiveOutBoundStream(
				peerId,
				this.components.connectionManager,
				`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(EffectProtocolMessage);
			await pb.write(message);

			if (!expectReply) {
				await stream.close();
				return;
			}

			const response = await pb.read();
			await stream.close();
			return response;
		} catch (e) {
			console.error("Error sending manager message", e);
			throw e;
		}
	}
}
