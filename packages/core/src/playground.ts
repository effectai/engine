// import { noise } from "@chainsafe/libp2p-noise"
// import { yamux } from "@chainsafe/libp2p-yamux"
// import { circuitRelayTransport } from "@libp2p/circuit-relay-v2"
// import { identify } from "@libp2p/identify"
// import { webRTC } from "@libp2p/webrtc"
// import { webSockets } from "@libp2p/websockets"
// import * as filters from "@libp2p/websockets/filters"
// import { createLibp2p } from "libp2p"
// import { gossipsub } from '@chainsafe/libp2p-gossipsub'
// import { multiaddr } from "@multiformats/multiaddr"

// const createManagerNode = async () => {
  
//     const manager = new ManagerNode


//     const worker = '/ip4/127.0.0.1/tcp/40591/ws/p2p/12D3KooWQBPqBN8qmbzpN5kYttT1brE1z1K98yXzxdsot77TcxWo/p2p-circuit/webrtc/p2p/12D3KooWCd9ooEpmsgZLWwAqQmZruecVsFLDvdAiQZSETLzR1x8B'
//     const ma = multiaddr(worker)
//     const connection = await manager.dial(ma)
//     console.log('Manager dialed worker', connection)
    
//     // open stream
//     const stream = await connection.newStream('/task-flow/1.0.0')
//     console.log('Manager opened stream to worker', stream)

//     stream.sink([new TextEncoder().encode('Hello worker!')])



//     // dial worker



//     return manager;
// }



// // dial worker 
