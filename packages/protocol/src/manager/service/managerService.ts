import {
  type Libp2pEvents,
  type PeerId,
  type PeerStore,
  type PrivateKey,
  type Startable,
  TypedEventEmitter,
  type TypedEventTarget,
} from "@libp2p/interface";

import { peerIdFromString } from "@libp2p/peer-id";

import type { Registrar, ConnectionManager } from "@libp2p/interface-internal";
import type { Datastore } from "interface-datastore";
import {
  type PeerQueue,
  type TaskStore,
  type TaskProtocol,
  type Task,
  extractPeerIdFromTaskResults,
  TaskStatus,
} from "../../core/src/index.js";

export interface ManagerServiceComponents {
  registrar: Registrar;
  peerStore: PeerStore;
  connectionManager: ConnectionManager;
  datastore: Datastore;
  events: TypedEventTarget<Libp2pEvents>;
  peerQueue?: PeerQueue;
  taskStore?: TaskStore;
  task: TaskProtocol;
  peerId: PeerId;
  privateKey: PrivateKey;
}

export interface ManagerServiceEvents {
  "task:received": CustomEvent<Task>;
}

export class ManagerService
  extends TypedEventEmitter<ManagerServiceEvents>
  implements Startable
{
  private components: ManagerServiceComponents;

  constructor(components: ManagerServiceComponents) {
    super();
    this.components = components;
  }

  start(): void | Promise<void> {
    this.components.task.addEventListener("task:received", async (taskInfo) => {
      //get the task from our store and sync it.
      //TODO:: only sync if checks are correct and valid
      await this.components.taskStore?.put(taskInfo.detail);

      if (taskInfo.detail.result) {
        console.log("Task completed successfully");
        //TODO:: give worker an ack response with signature for payout ?
        this.ackTask(taskInfo.detail);
      }
    });
  }

  stop(): void | Promise<void> {
    // throw new Error("Method not implemented.");
  }

  public async acceptTask(task: Task) {
    if (!this.components.taskStore) {
      throw new Error("TaskStore is required to accept tasks");
    }

    await this.components.taskStore.put(task);

    //TODO:: check if task is valid and can be processed
    await this.processTask(task);
  }

  public async ackTask(task: Task) {
    if (!this.components.taskStore) {
      throw new Error("TaskStore is required to accept tasks");
    }

    const { peerId } = extractPeerIdFromTaskResults(task.result);

    const result = await this.components.task.signTask(
      task,
      this.components.privateKey
    );
    result.status = TaskStatus.COMPLETED;

    //sync task with store
    await this.components.taskStore.put(result);

    this.components.task.sendTask(peerId, result);
    console.log("Task signed and acknowledged", result);
  }

  public async processTask(task: Task) {
    //check if taskStore is available  and peerQueue is available
    if (!this.components.taskStore || !this.components.peerQueue) {
      throw new Error("TaskStore and PeerQueue are required to process tasks");
    }

    //get the fist peer from the queue
    const peerString = this.components.peerQueue.dequeue();

    if (!peerString) {
      console.log("No peers available to process task..");
      return;
    }

    const peer = await this.components.peerStore.get(
      peerIdFromString(peerString)
    );

    if (!peer) {
      console.log("Peer not found in peerStore");
      return;
    }

    task.manager = this.components.peerId.toString();

    //send the task to the peer
    await this.components.task.sendTask(peerString, task);

    // put the peer back in the queue
    this.components.peerQueue.enqueue(peerString);

    return {
      peer,
      task,
    };
  }
}

export function managerService(): (
  // init: Partial<TaskManagerInit> = {}
  components: ManagerServiceComponents
) => ManagerService {
  return (components: ManagerServiceComponents) =>
    new ManagerService(components);
}
