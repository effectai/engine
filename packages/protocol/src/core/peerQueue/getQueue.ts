import { WorkerQueue } from "../../manager-old/modules/session/queue.js";
import type { PeerIdStr } from "./types.js";

export const getQueue = (queue: PeerIdStr[]): PeerIdStr[] => {
	return [...queue];
};
