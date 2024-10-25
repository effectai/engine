import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { circuitRelayServer, circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import * as filters from '@libp2p/websockets/filters'
import { createLibp2p } from "libp2p";
import { identify } from '@libp2p/identify'
import { echo } from '@libp2p/echo'

const createRelay = async () => {
    const relay = await createLibp2p({
        addresses: {
          listen: ['/ip4/127.0.0.1/tcp/0/ws']
        },
        denyDialMultiaddr: async () => false,
        transports: [
          webSockets({filter: filters.all})
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
          identify: identify(),
          relay: circuitRelayServer()
        }
      })

      console.log('Relay listening on:', relay.getMultiaddrs())
}

createRelay()