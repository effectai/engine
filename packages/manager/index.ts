// managerNode.ts (Node.js)

import { createLibp2p, Libp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';

export async function createManagerNode(): Promise<Libp2p> {
  const managerNode = await createLibp2p({
    transports: [
        webSockets()
    ],
    streamMuxers: [yamux()],
  });
  
  return managerNode;
}

export async function connectToWorker(managerNode: Awaited<ReturnType<typeof createManagerNode>>, workerAddress: Multiaddr) {
  const connection = await managerNode.dial(workerAddress);
}

// const workerAddress = '/dns4/localhost/tcp/15002/ws/p2p/QmWorkerPeerId'; // Example multiaddr of a worker
// connectToWorker(workerAddress);
