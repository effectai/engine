import type { Connection } from '@libp2p/interface'
import  { Libp2pNode, type Batch, type TaskFlowMessage, discoverWorkerNodes } from '@effectai/task-core'
import { nanoid } from 'nanoid'
import { pipe } from 'it-pipe'

export type InternalTask = {
  id: string,
  data: Record<string, any>,
  activeWorker: Connection | null,
  requestSentAt: number | null,
  result: null | string
}

// flow of task delegation:
// - manager requests all active worker nodes from the network
// - manager sends tasks to available worker nodes
// - worker nodes accepts a task and marks themselves as busy
// - worker nodes send the result back to the manager

export class ManagerNode extends Libp2pNode {
  activeBatch: Batch | null = null;
  taskMap: Map<string, InternalTask> = new Map();

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

  async delegateTask(batch: Batch, task: InternalTask) {
    const addresses = await discoverWorkerNodes()

    for(const address of addresses) {
      console.log('Dialing worker node:', address.toString());
      if(!this.node) {
        throw new Error('Node not initialized');
      }

      const workerNode = await this.node.dial(address);

      if(!workerNode) {
        console.log('Failed to connect to worker node:', address.toString());
        continue;
      }

      const stream = await workerNode.newStream('/task-flow/1.0.0');

      const sendTaskMessage = JSON.stringify({ t: 'task', d: {
        id: task.id,
        template: batch.template,
        data: task.data,
      } });

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
            console.log('Received messsage from worker:',t,d);
          }
        }
      )
      // wait 60 seconds for the worker to accept the task
      // await new Promise(resolve => setTimeout(resolve, 60_000));
    }
  }

  async manageBatch(batch: Batch) {
    if(!this.node) {
      throw new Error('Node not initialized');
    }

    if(this.activeBatch) {
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

