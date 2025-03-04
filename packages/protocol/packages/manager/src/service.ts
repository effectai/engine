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
	type WorkerQueue,
	type TaskStore,
	type TaskProtocolService,
	type Task,
	TaskStatus,
	type ChallengeProtocol,
	extractPeerIdFromTaskResults,
	PaymentProtocolService,
} from "@effectai/protocol-core";

export interface ManagerServiceComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	payment?: PaymentProtocolService;
	workerQueue?: WorkerQueue;
	taskStore?: TaskStore;
	challenge: ChallengeProtocol;
	task: TaskProtocolService;
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
		//check if all mandatory components are available

		this.components.task.addEventListener("task:received", async (taskInfo) => {
			//get the task from our store and sync it.
			//TODO:: only sync if checks are correct and valid
			await this.components.taskStore?.put(taskInfo.detail);

			if (taskInfo.detail.result) {
				await this.ackTask(taskInfo.detail);
			}
		});

		this.components.events.addEventListener(
			"peer:discovery",
			async ({ detail }) => {
				//add metadata on when the peer was discovered
				await this.components.peerStore.merge(detail.id, {
					metadata: {
						discoveredAt: Buffer.from(new Date().toISOString()),
					},
				});

				const peer = await this.components.peerStore.get(detail.id);
				console.log("Peer discovered", peer);
			},
		);

		this.components.ch;
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
			this.components.privateKey,
		);
		result.status = TaskStatus.COMPLETED;

		//sync task with store
		await this.components.taskStore.put(result);

		this.components.task.sendTask(peerId, result);
		console.log("Task signed and acknowledged", result);
	}

	public async processTask(task: Task) {
		//check if taskStore is available  and peerQueue is available
		if (!this.components.taskStore || !this.components.workerQueue) {
			throw new Error("TaskStore and PeerQueue are required to process tasks");
		}

		const peerString = this.components.workerQueue.dequeue();

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
		await this.components.task.sendTask(peerString, task);

		// put the peer back in the queue
		this.components.workerQueue.enqueue(peerString);

		return {
			peer,
			task,
		};
	}

	async generatePayment(peerId: string, task: Task) {
		this.components.payment;
	}
}

export function managerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
