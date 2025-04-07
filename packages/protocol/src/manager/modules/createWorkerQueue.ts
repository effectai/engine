import type { PeerId } from "@libp2p/interface";
import {
	addPeer,
	dequeuePeer,
	type PeerIdStr,
} from "../../core/peerQueue/index.js";

export const createWorkerQueue = () => {
	const queue: PeerIdStr[] = [];

	return {
		queue,
		addWorker: (peerId: PeerId) =>
			addPeer({ queue, peerIdStr: peerId.toString() }),
		getWorkerQueue: () => [...queue],
		dequeueWorker: () => dequeuePeer(queue),
	};
};
