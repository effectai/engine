import { Libp2pNode, type Batch, type TaskFlowMessage, discoverWorkerNodes, type Connection, createLibp2p, webSockets, webRTC, circuitRelayTransport, noise, yamux, identify, filters, type Multiaddr, type Libp2p } from '@effectai/task-core'
import { nanoid } from 'nanoid'
import { pipe } from 'it-pipe'

export type InternalTask = {
  id: string,
  data: Record<string, any>,
  activeWorker: Connection | null,
  requestSentAt: number | null,
  result: null | string
}

export type ManagerState = {
  workerNodes: Multiaddr[],
  activeBatch: Batch | null,
  taskMap: Map<string, InternalTask>
}

export interface ManagerEvents {
  initialized: Libp2p; // Add the appropriate type
  'state:updated': ManagerState; // The state type you are using
  'batch:started': Batch;
  'task:completed': InternalTask;
}

declare module 'events' {
  interface EventEmitter {
    on<K extends keyof ManagerEvents>(event: K, listener: (payload: ManagerEvents[K]) => void): this;
    emit<K extends keyof ManagerEvents>(event: K, payload: ManagerEvents[K]): boolean;
  }
}

export class ManagerNode extends Libp2pNode<ManagerState> {

  constructor() {
    super({
      workerNodes: [],
      activeBatch: null,
      taskMap: new Map()
    })
  }


  async init() {

    this.node = await createLibp2p({
      transports: [webSockets({ filter: filters.all }), webRTC(), circuitRelayTransport()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: { identify: identify() },
    });

    this.emit('initialized', this.node);
  }


  async delegateBatch(batch: Batch) {
    // delegate each uncompleted task to a worker node
    for (const [index, task] of this.state.taskMap.entries()) {
      await this.delegateTask(batch, task);
    }
    // wait for all tasks to be completed
    while (Array.from(this.state.taskMap.values()).some(task => task.result === null)) {
      console.log('Waiting for tasks to be completed...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async invalidateTasks() {
    for (const [index, task] of this.state.taskMap.entries()) {
      // if task is sent to a worker node and it has not responded in 60 seconds, invalidate the task
      if (task.requestSentAt && Date.now() - task.requestSentAt > 60000) {
      }
    }
  }

  async delegateTask(batch: Batch, task: InternalTask) {
    const addresses = this.state.workerNodes

    for (const address of addresses) {
      if (!this.node) {
        throw new Error('Node not initialized');
      }

      console.log('Dialing worker node:', address.toString());
      const workerNode = await this.node.dial(address);

      if (!workerNode) {
        console.error('Failed to connect to worker node:', address.toString());
        continue;
      }

      const stream = await workerNode.newStream('/task-flow/1.0.0');

      const sendTaskMessage = JSON.stringify({
        t: 'task', d: {
          id: task.id,
          template: batch.template,
          data: task.data,
        }
      });

      task.requestSentAt = Date.now();

      await stream.sink([new TextEncoder().encode(sendTaskMessage)]);

      // handle the response from the worker synchronously
      // TODO:: if the task is not accepted after 60 seconds, retry with another worker
      pipe(
        stream.source,
        async function (source) {
          for await (const msg of source) {
            // handle task rejection
            const receivedData = JSON.parse(new TextDecoder().decode(msg.subarray()))
            const { d, t } = receivedData as TaskFlowMessage;

            if (t === 'task-rejected') {
              console.log('Task rejected by worker node:', d.id);
              break;
            }

            // handle task acceptance
            if (t === 'task-accepted') {
              console.log('Task accepted by worker node:', d.id);
              task.activeWorker = workerNode;
              break;
            }

            if (t === 'task-completed') {
              console.log('Task completed by worker node:', d.id);
              task.result = d.result;
              break;
            }
          }
        }
      )
    }
  }


  async manageBatch(batch: Batch) {
    if (!this.node) {
      throw new Error('Node not initialized');
    }

    if (this.state.activeBatch) {
      throw new Error('There is already an active batch');
    }

    // store an in-memory map of tasks and their results
    this.setState({
      activeBatch: batch, taskMap: new Map(
        batch.data.map((task) => [
          nanoid(),
          {
            id: nanoid(),
            activeWorker: null,
            requestSentAt: null,
            data: task,
            result: null
          }
        ])
      )
    });

    this.emit('batch:started', batch);
    // start delegating tasks in this batch to worker nodes
    await this.delegateBatch(batch);
  }
}

