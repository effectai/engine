export type PeerIdStr = string;

export const createWorkerQueue = () => {
  const queue: PeerIdStr[] = [];

  const addPeer = ({
    peerIdStr,
  }: {
    peerIdStr: PeerIdStr;
  }): void => {
    if (!queue.includes(peerIdStr)) {
      queue.push(peerIdStr);
    }
  };

  const dequeuePeer = (): PeerIdStr | undefined => {
    if (queue.length === 0) return undefined;
    const peer = queue.shift(); // Remove from the front
    if (peer) queue.push(peer); // Add back to the end
    return peer;
  };

  const getQueue = (): PeerIdStr[] => {
    return [...queue];
  };

  return {
    queue,
    addPeer,
    dequeuePeer,
    getQueue,
  };
};
