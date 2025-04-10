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
    const peer = queue.shift();
    if (peer) queue.push(peer); 
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
