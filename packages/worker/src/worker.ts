import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import { Uint8ArrayList } from 'uint8arraylist';
import { Libp2pNode, type TaskPayload } from '@effectai/task-core';

export enum STATUS {
  IDLE = 'idle',
  BUSY = 'busy',
}

export class WorkerNode extends Libp2pNode {
  public status: STATUS = STATUS.IDLE;

  async start(port: number) {
    await super.start(port);

    if(!this.node){
      throw new Error('Node not initialized');
    }

    this.node.handle('/task-flow/1.0.0', async ({ stream }) => {
      const data = new Uint8ArrayList();
  
      for await (const chunk of stream.source) {
        data.append(chunk);
      }
  
      console.log('Received data from manager:', new TextDecoder().decode(data.subarray()));
  
      // read the data
      const receivedData = new TextDecoder().decode(data.subarray())
      // parse the data
      const parsedData = JSON.parse(receivedData) as TaskPayload

      this.handleTaskPayload(parsedData)
    });
  }

  async handleTaskPayload(payload: TaskPayload){
    if(!this.node){
      throw new Error('Node not initialized');
    }

    if(this.status === STATUS.BUSY){
      return;
    }

    this.status = STATUS.BUSY;

    console.log("handling task payload", payload)
    const managerAddress = multiaddr('/dns4/localhost/tcp/15000/ws');
    const connection = await this.node.dial(managerAddress)
    const stream = await connection.newStream('/task-flow/1.0.0')
    const data = new TextEncoder().encode(JSON.stringify({ type: 'task-accepted', id: payload.id }));

    // todo: send bytes instead of string ]
    await stream.sink([data])
  }
}

// TODO:: discover an array of worker nodes
export const discoverWorkerNodes = async (): Promise<Multiaddr[]> => {
  return [
    multiaddr('/dns4/localhost/tcp/15001/ws')
  ];
}

