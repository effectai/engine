import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { echo } from '@libp2p/echo'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { webRTC } from '@libp2p/webrtc'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { WebRTC } from '@multiformats/multiaddr-matcher'
import delay from 'delay'
import { pipe } from 'it-pipe'
import { createLibp2p } from 'libp2p'
import { multiaddr } from '@multiformats/multiaddr';

const createDialer = async () => {
    const dialer = await createLibp2p({
        transports: [
          webSockets({filter: filters.all}),
          webRTC(),
          circuitRelayTransport()
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
          identify: identify(),
          echo: echo()
        }
      })

      const addr = multiaddr('/ip4/127.0.0.1/tcp/46381/ws/p2p/12D3KooWJWXLHRUe89TAcU2FR4VSv58uD28cLyuA12KFavYb7uVB/p2p-circuit/webrtc/p2p/12D3KooWPHy4f1Ues2QtFuQLNxMdZhbP3r2XT4Ro53kWC5ksEPWi')

      const stream = await dialer.dialProtocol(addr, 'test:1.0.0', {
        signal: AbortSignal.timeout(5000)
      })

      await pipe(1
        [new TextEncoder().encode('hello world')],
        stream,
        async source => {
          for await (const buf of source) {
            console.info(new TextDecoder().decode(buf.subarray()))
          }
        }
      )
}

  createDialer();