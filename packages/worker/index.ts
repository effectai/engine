// workerNode.ts (Browser)
import { createLibp2p, type Libp2p } from 'libp2p';
import { webTransport } from '@libp2p/webtransport'
import { multiaddr } from '@multiformats/multiaddr';
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'

export async function createWorkerNode(): Promise<Libp2p> {
  const workerNode = await createLibp2p({
    transports: [
      webTransport()
    ],
    addresses: {
      listen: ['/dns4/localhost/tcp/15002/ws']
    },
    connectionEncrypters: [
      noise()
    ],
    streamMuxers: [yamux()],
  });

  return workerNode
}

export function getMultiAddr(peerId: string) {
  return multiaddr(`/dns4/localhost/tcp/15002/ws/p2p/${peerId}`)
}
