import { Uint8ArrayList } from 'uint8arraylist';
import {
  Libp2pNode, Task, type TaskFlowMessage,
  type TaskPayload, filters,
  createLibp2p, yamux, webSockets,
  webRTC, noise, circuitRelayTransport, identify,
  type NodeEventMap
} from '@effectai/task-core';

export enum STATUS {
  IDLE = 'idle',
  BUSY = 'busy',
}

type WorkerState = {
  status: STATUS
  activeTask: Task | null
}

export interface WorkerEvents extends NodeEventMap<WorkerState> {
  'incoming-task': TaskPayload;
  'accept-task': Task;
  'reject-task': Task;
}

export class WorkerNode extends Libp2pNode<WorkerState, WorkerEvents> {
  activeTask: Task | null = null;

  constructor() {
    super({
      status: STATUS.IDLE,
      activeTask: null
    });
  }

  async rejectTask(task: Task) {
    this.activeTask = null;
    this.emit('reject-task', task);
    return true;
  }

  async acceptTask(task: Task) {
    if (this.state.status === STATUS.BUSY) {
      return false;
    }
    this.state.status = STATUS.BUSY;
    this.activeTask = task;
    this.emit('accept-task', task);
    return true;
  }

  async init(){
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

    this.node.handle('/task-flow/1.0.0', async (streamData) => {
      const data = new Uint8ArrayList();

      for await (const chunk of streamData.stream.source) {
        data.append(chunk);
      }

      const messageFromManager = JSON.parse(new TextDecoder().decode(data.subarray())) as TaskFlowMessage;

      switch (messageFromManager.t) {
        case 'task': {
          const payload = messageFromManager.d as TaskPayload;
          const task = Task.fromPayload(payload);
          this.emit('incoming-task', task);

          if (this.state.status === STATUS.BUSY) {
            await this.rejectTask(task)
            const message = JSON.stringify({
              t: 'task-rejected', d: {
                id: task.id
              }
            });
            await streamData.stream.sink([new TextEncoder().encode(message)]);
            return;
          }

          break;
        }
      }
    });

  }
}



