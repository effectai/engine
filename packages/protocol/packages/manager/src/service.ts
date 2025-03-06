import {
	type ComponentLogger,
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
	PaymentProtocolService,
	WorkerQueue,
	type TaskStore,
	TaskProtocolService,
	type Task,
	TaskStatus,
	extractPeerIdFromTaskResults,
	ChallengeProtocolService,
	workerQueue,
} from "@effectai/protocol-core";

export interface ManagerServiceComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	peerId: PeerId;
	privateKey: PrivateKey;
	logger: ComponentLogger;
}

export interface ManagerServiceEvents {
	"task:received": CustomEvent<Task>;
}

export class ManagerService
	extends TypedEventEmitter<ManagerServiceEvents>
	implements Startable
{
	private components: ManagerServiceComponents;
	private readonly taskService: TaskProtocolService;
	private readonly challengeService: ChallengeProtocolService;
	private readonly paymentService: PaymentProtocolService;
	private readonly workerQueueService: WorkerQueue;

	constructor(components: ManagerServiceComponents) {
		super();
		this.components = components;
		this.taskService = new TaskProtocolService(this.components);
		this.challengeService = new ChallengeProtocolService(this.components);
		this.paymentService = new PaymentProtocolService(this.components);
		this.workerQueueService = new WorkerQueue(this.components);
	}

	start(): void | Promise<void> {
		//check if all mandatory components are available

		this.taskService.addEventListener("task:received", async (taskInfo) => {
			//get the task from our store and sync it.
			//TODO:: only sync if checks are correct and valid
			await this.taskService.storeTask(taskInfo.detail);

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
	}

	stop(): void | Promise<void> {
		// throw new Error("Method not implemented.");
	}

	public async acceptTask(task: Task) {
		await this.taskService.storeTask(task);
		//TODO:: check if task is valid and can be processed
		await this.processTask(task);
	}

	public async ackTask(task: Task) {
		const { peerId } = extractPeerIdFromTaskResults(task.result);

		const result = await this.taskService.signTask(
			task,
			this.components.privateKey,
		);
		result.status = TaskStatus.COMPLETED;

		//sync task with store
		await this.taskService.storeTask(result);

		this.taskService.sendTask(peerId, result);
		console.log("Task signed and acknowledged", result);
	}

	public async processTask(task: Task) {
		//check if taskStore is available  and peerQueue is available
		const peerString = this.workerQueueService.dequeue();

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
		await this.taskService.sendTask(peerString, task);

		// put the peer back in the queue
		this.workerQueueService.enqueue(peerString);

		return {
			peer,
			task,
		};
	}

	async generatePayment(peerId: string, task: Task) {}

	async getQueue() {
		return this.workerQueueService.getQueue();
	}

	async getTasks() {
		return this.taskService.getTasks();
	}
}

export function managerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
