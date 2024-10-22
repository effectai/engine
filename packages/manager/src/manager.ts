import { createLibp2p, type Libp2p } from 'libp2p';
import type { Connection } from '@libp2p/interface'
import { webSockets } from '@libp2p/websockets'
import { yamux } from '@chainsafe/libp2p-yamux'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import { noise } from '@chainsafe/libp2p-noise';
import { Uint8ArrayList } from 'uint8arraylist';
import { discoverWorkerNodes } from "@effectai/task-worker"
import  { Libp2pNode, type Batch, type TaskFlowMessage } from '@effectai/task-core'
import { nanoid } from 'nanoid'

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
    // step 1: fetch all active worker nodes
    const addresses = await discoverWorkerNodes()

    for(const address of addresses) {
      console.log('Dialing worker node:', address.toString());
      if(!this.node) {
        throw new Error('Node not initialized');
      }

      // step 2: dial the worker node
      const workerNode = await this.node.dial(address);
      if(!workerNode) {
        console.log('Failed to connect to worker node:', address.toString());
        continue;
      }

      const stream = await workerNode.newStream('/task-flow/1.0.0');

      const data = new TextEncoder().encode(JSON.stringify({ template: batch.template, data: task.data, id:task.id }));
      task.requestSentAt = Date.now();
      console.log('Sending task to worker:', task.id);
      await stream.sink([data]);
      // wait 60 seconds for the worker to accept the task
      await new Promise(resolve => setTimeout(resolve, 60_000));
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

    // listen for results from the worker nodes
    this.node.handle('/task-flow/1.0.0', async ({ stream }) => {
      // the workers will send the task id along with the result data in the stream
      // we need to parse the task id to know which task the result belongs to
      const data = new Uint8ArrayList();

      for await (const chunk of stream.source) {
        data.append(chunk);
      }

      const receivedData = data.subarray();
      const { id, result, type } = JSON.parse(new TextDecoder().decode(receivedData)) as TaskFlowMessage;

      if (type == 'task-accepted') {
        console.log('Worker accepted task:', id, type);
        const task = this.taskMap.get(id);
        if (task) {
          // task.activeWorker = stream.connection;
        }
      }
    })

    // start delegating tasks in this batch to worker nodes
    await this.delegateBatch(batch);
  }
}

export const preRenderTask = async (template: string, placeholders: Record<string, any>): Promise<string> => {
  return template.replace(/{{(.*?)}}/g, (_, match) => placeholders[match]);
}