import { Libp2pNode, type Batch, type TaskFlowMessage, discoverWorkerNodes, type Connection, createLibp2p, webSockets, webRTC, circuitRelayTransport, noise, yamux, identify, filters, type Multiaddr } from '@effectai/task-core'
import { nanoid } from 'nanoid'
import { pipe } from 'it-pipe'

export type InternalTask = {
  id: string,
  data: Record<string, any>,
  activeWorker: Connection | null,
  requestSentAt: number | null,
  result: null | string
}

export class ManagerNode extends Libp2pNode {
  activeBatch: Batch | null = null;
  taskMap: Map<string, InternalTask> = new Map();
  public workerNodes: Multiaddr[] = [];

  async start(port: number) {
    this.node = await createLibp2p({
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
  }


  async delegateBatch(batch: Batch) {
    // delegate each uncompleted task to a worker node
    for (const [index, task] of this.taskMap.entries()) {
      await this.delegateTask(batch, task);
    }
    // wait for all tasks to be completed
    while (Array.from(this.taskMap.values()).some(task => task.result === null)) {
      console.log('Waiting for tasks to be completed...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async invalidateTasks() {
    for (const [index, task] of this.taskMap.entries()) {
      // if task is sent to a worker node and it has not responded in 60 seconds, invalidate the task
      if (task.requestSentAt && Date.now() - task.requestSentAt > 60000) {
      }
    }
  }

  async delegateTask(batch: Batch, task: InternalTask) {
    const addresses = this.workerNodes

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

    if (this.activeBatch) {
      throw new Error('There is already an active batch');
    }

    // set the active batch
    this.activeBatch = batch;

    // store an in-memory map of tasks and their results
    this.taskMap = new Map(
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
    );
    // start delegating tasks in this batch to worker nodes
    await this.delegateBatch(batch);
  }
}

