import { Uint8ArrayList } from "uint8arraylist";
import { pbStream } from "it-protobuf-stream";

import {
	type Libp2pEvents,
	NodeInfo,
	Peer,
	type PeerId,
	type PeerInfo,
	type PeerStore,
	type Startable,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";

import { peerIdFromString } from "@libp2p/peer-id";

import type { Registrar, ConnectionManager } from "@libp2p/interface-internal";
import type { Task } from "../../protocols/task/pb/task.js";
import type { TaskStore } from "../store/task.js";
import type { Datastore } from "interface-datastore";
import type { PeerQueue } from "../queue/peer.js";
import type { TaskProtocol } from "../../protocols/task/task.js";

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
}

export interface ManagerServiceEvents {
	"task:received": CustomEvent<Task>;
	"peer:discovered": CustomEvent<PeerInfo>;
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
			console.log("Task received", taskInfo.detail);
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
	}

	public async processTask(task: Task) {
		//check if taskStore is available  and peerQueue is available
		if (!this.components.taskStore || !this.components.peerQueue) {
			throw new Error("TaskStore and PeerQueue are required to process tasks");
		}

		//store the task in the taskStore
		await this.components.taskStore.put(task);

		//get the fist peer from the queue
		const peerString = this.components.peerQueue.dequeue();

		if (!peerString) {
			console.log("No peers available to process task..");
			return;
		}

		const peer = await this.components.peerStore.get(
			peerIdFromString(peerString),
		);

		if (!peer) {
			console.log("Peer not found in peerStore");
			return;
		}

		task.manager = this.components.peerId.toString();
		//send the task to the peer
		await this.components.task.sendTask(peer.id, task);

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
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
