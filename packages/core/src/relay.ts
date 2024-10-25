import { createLibp2p } from "libp2p"
import { webRTC } from "@libp2p/webrtc"
import { webSockets } from "@libp2p/websockets"
import { bootstrap } from '@libp2p/bootstrap'
import { identify } from "@libp2p/identify"
import { circuitRelayServer } from "@libp2p/circuit-relay-v2"
import { yamux } from "@chainsafe/libp2p-yamux"
import { noise } from "@chainsafe/libp2p-noise"
import * as filters from '@libp2p/websockets/filters'
import { gossipsub } from "@chainsafe/libp2p-gossipsub"
import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery"

const createRelayServer = async () => {
    const relay = await createLibp2p({
        transports: [
            webSockets({ filter: filters.all })
        ],
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/0/ws']
        },
        peerDiscovery: [
            pubsubPeerDiscovery({})
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
            pubsub: gossipsub(),
            identify: identify(),
            relay: circuitRelayServer()
        }
    })

    relay.addEventListener('peer:discovery', (peer) => {
        console.log("Relay discovered a peer", peer.target)
    })

    // subscripe to worker discovery topic
    relay.services.pubsub.subscribe('worker-discovery');
    relay.services.pubsub.addEventListener('message', (msg) => {
        console.log("Relay received message", msg.toString())
        // forward message to all connected manager nodes
    })

    await relay.start();
    console.log('Relay server listening on:', relay.getMultiaddrs())
}

createRelayServer()