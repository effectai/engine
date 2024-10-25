
import { createLibp2p, webSockets, identify, circuitRelayServer, yamux, noise, filters } from "@effectai/task-core"

export const createRelayServer = async () => {
    const relay = await createLibp2p({
        transports: [
            webSockets({ filter: filters.all })
        ],
        addresses: {
            listen: ['/ip4/127.0.0.1/tcp/0/ws']
        },
        // peerDiscovery: [
            // pubsubPeerDiscovery({})
        // ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
            // pubsub: gossipsub(),
            identify: identify(),
            relay: circuitRelayServer()
        }
    })

    relay.addEventListener('peer:discovery', (peer) => {
        console.log("Relay discovered a peer", peer.target)
    })

    await relay.start();
    
    console.log('Relay server listening on:', relay.getMultiaddrs())

    return relay
}