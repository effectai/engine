import { Uint8ArrayList } from 'uint8arraylist';
import { Libp2pNode, type TaskFlowMessage, type TaskPayload } from '@effectai/task-core';
import { type Stream } from '@effectai/task-core';

export enum STATUS {
  IDLE = 'idle',
  BUSY = 'busy',
}

export class WorkerNode extends Libp2pNode {
  public status: STATUS = STATUS.IDLE;

  async start(port: number) {
    await super.start(port);

    if (!this.node) {
      throw new Error('Node not initialized');
    }

    this.node.handle('/task-flow/1.0.0', async (streamData) => {
      const data = new Uint8ArrayList();

      for await (const chunk of streamData.stream.source) {
        data.append(chunk);
      }

      const messageFromManager = JSON.parse(new TextDecoder().decode(data.subarray())) as TaskFlowMessage;

      switch(messageFromManager.t) {
        case 'task':
          if(this.status === STATUS.BUSY) {
            const message = JSON.stringify({
              t: 'task-rejected', d: {
                id: messageFromManager.d.id
              }
            });

            await streamData.stream.sink([new TextEncoder().encode(message)]);
            return;
          }

          this.status = STATUS.BUSY;

          const message = JSON.stringify({
            t: 'task-accepted', d: {
              id: messageFromManager.d.id
            }
          });

          await streamData.stream.sink([new TextEncoder().encode(message)]);

          break;
      }
    });
  }
}



