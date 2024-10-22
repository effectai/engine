// workerNode.ts (Browser)
import { createLibp2p, type Libp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets'
import { multiaddr } from '@multiformats/multiaddr';
import { noise } from '@chainsafe/libp2p-noise'
import {yamux} from '@chainsafe/libp2p-yamux'

export async function createWorkerNode(): Promise<Libp2p> {
  const workerNode = await createLibp2p({
    transports: [
      webSockets({
      })
    ],
    addresses: {
      listen: ['/dns4/localhost/tcp/15001/ws'] // Worker listens here
    },
    connectionEncrypters: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
  });

  return workerNode
}
