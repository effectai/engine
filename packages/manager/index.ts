import { createLibp2p, type Libp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import { noise } from '@chainsafe/libp2p-noise';
import { Uint8ArrayList } from 'uint8arraylist';


export async function createManagerNode(): Promise<Libp2p> {
  const managerNode = await createLibp2p({
    transports: [
      webSockets()
    ],
    connectionEncrypters: [
      noise()
    ],
    streamMuxers: [yamux()],
    addresses: {
      listen: ['/dns4/localhost/tcp/15000/ws']
    }
  });

  managerNode.handle('/task-flow/1.0.0', async ({ stream }) => {
    const data = new Uint8ArrayList();
  
    for await (const chunk of stream.source) {
      data.append(chunk);  // Append the chunks into the Uint8ArrayList
    }
  
    // Convert Uint8ArrayList to a single Uint8Array
    const receivedData = data.subarray();
    
    console.log('Received data from worker:', new TextDecoder().decode(receivedData));
  });

  return managerNode;
}

export async function connectToWorker(managerNode: Awaited<ReturnType<typeof createManagerNode>>, workerAddress: Multiaddr) {
  const connection = await managerNode.dial(workerAddress);
}
