import type { PeerIdStr } from "@chainsafe/libp2p-gossipsub/types";
import type { WorkerQueue } from "./types.js";

export type AddPeerParams = {
  queue: WorkerQueue;
  peerIdStr: PeerIdStr;
};

export const addPeer = ({ queue, peerIdStr }: AddPeerParams): void => {
  if (!queue.includes(peerIdStr)) {
    queue.push(peerIdStr);
  }
};
