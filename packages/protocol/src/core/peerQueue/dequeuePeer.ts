import type { WorkerQueue, PeerIdStr } from "./types.js";

export const dequeuePeer = (queue: PeerIdStr[]): PeerIdStr | undefined => {
	if (queue.length === 0) return undefined;
	const peer = queue.shift(); // Remove from the front
	if (peer) queue.push(peer); // Add back to the end
	return peer;
};
