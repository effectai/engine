import { type Batch, peerIdFromString, multiaddr } from "@effectai/task-core";
import { ManagerNode } from "./index.js";

const exampleBatch: Batch = {
    repetitions: 2,
    validationRate: 0.5,
    template: '<html><body><h1>{{title}}</h1><p>{{description}}</p> <input type="submit" value="submit"/> </body></html>',
    data: [
      {
        title: 'Task 1',
        description: 'This is task 1'
      },
      {
        title: 'Task 2',
        description: 'This is task 2'
      }
    ]
  }


const startManager = async () => {
    console.log('Starting manager node')

    const manager = new ManagerNode()
    await manager.start(15000)

    const workerNodes = [
      multiaddr('/ip4/127.0.0.1/tcp/40591/ws/p2p/12D3KooWQBPqBN8qmbzpN5kYttT1brE1z1K98yXzxdsot77TcxWo/p2p-circuit/webrtc/p2p/12D3KooWDJ2e6SNANEhnzkZ37B5SKan4q8u1pGZjB3S7moxncNma')
    ]

    manager.workerNodes = workerNodes;

    await manager.manageBatch(exampleBatch)
}

startManager()