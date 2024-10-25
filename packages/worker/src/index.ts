import { Uint8ArrayList } from 'uint8arraylist';
import {
  Libp2pNode, Task, type TaskFlowMessage,
  type TaskPayload, filters,
  createLibp2p, yamux, webSockets,
  webRTC, noise, circuitRelayTransport, identify
} from '@effectai/task-core';

export enum STATUS {
  IDLE = 'idle',
  BUSY = 'busy',
}

export class WorkerNode extends Libp2pNode {
  public status: STATUS = STATUS.IDLE;
  activeTask: Task | null = null;

  async start(port: number) {
    this.node = await createLibp2p({
      addresses: {
        listen: [
          '/p2p-circuit',
          '/webrtc'
        ]
      },
      peerDiscovery: [
        // pubsubPeerDiscovery({
        // interval: 5000
        // })
      ],
      connectionGater: {
        denyDialMultiaddr: async () => false,
      },
      transports: [
        webSockets({ filter: filters.all }),
        webRTC(),
        circuitRelayTransport()
      ],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        identify: identify(),
      }
    })

    if (!this.node) {
      throw new Error('Node not initialized');
    }

    this.node.handle('/task-flow/1.0.0', async (streamData) => {
      const data = new Uint8ArrayList();

      for await (const chunk of streamData.stream.source) {
        data.append(chunk);
      }

      const messageFromManager = JSON.parse(new TextDecoder().decode(data.subarray())) as TaskFlowMessage;

      console.log("Worker received message", messageFromManager);

      switch (messageFromManager.t) {
        case 'task':

          const payload = messageFromManager.d as TaskPayload;
          const task = Task.fromPayload(payload);


          if (this.status === STATUS.BUSY) {
            const message = JSON.stringify({
              t: 'task-rejected', d: {
                id: task.id
              }
            });

            await streamData.stream.sink([new TextEncoder().encode(message)]);
            return;
          }

          this.status = STATUS.BUSY;

          const message = JSON.stringify({
            t: 'task-accepted', d: {
              id: task.id
            }
          });

          // OPTIONAL wait for acknowledgement from the manager node before setting active task
          //TODO:: move to SetActiveTask()
          this.activeTask = task;
          await streamData.stream.sink([new TextEncoder().encode(message)]);

          break;
      }
    });
  }
}



