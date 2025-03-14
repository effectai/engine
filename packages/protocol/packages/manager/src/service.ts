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
	type TaskStore,
	TaskProtocolService,
	type Task,
	TaskStatus,
	extractPeerIdFromTaskResults,
	ChallengeProtocolService,
	WorkerTaskQueue,
	getOrCreateConnection,
	Payment,
} from "@effectai/protocol-core";
import { Challenge } from "../../core/dist/protocols/challenge/pb/challenge.js";

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
	private readonly workerQueueService: WorkerTaskQueue;

	constructor(components: ManagerServiceComponents) {
		super();
		this.components = components;
		this.taskService = new TaskProtocolService(this.components);
		this.challengeService = new ChallengeProtocolService(this.components);
		this.paymentService = new PaymentProtocolService(this.components);
		this.workerQueueService = new WorkerTaskQueue(this.components);
	}

	start(): void | Promise<void> {
		this.taskService.addEventListener("task:received", async (taskInfo) => {
			//get the task from our store and sync it.
			//TODO:: only sync if checks are correct and valid
			await this.taskService.storeTask(taskInfo.detail);

			if (taskInfo.detail.result) {
				await this.acknowledgeTaskCompletion(taskInfo.detail);
			}
		});

		this.challengeService.addEventListener(
			"challenge:received",
			async (challengeInfo) => {
				//TODO:: check if the challenge is valid and can be processed

				const result = JSON.parse(challengeInfo.detail.task?.result || "");

				if (result.result === challengeInfo.detail.answer) {
					//TODO:: handle passed challenge
					console.log("Challenge passed");
				} else {
					//TODO:: handle failed challenge
					console.log("Challenge failed");
				}
			},
		);

		this.components.events.addEventListener(
			"peer:discovery",
			async ({ detail }) => {
				//add metadata on when the peer was discovered
				await this.components.peerStore.merge(detail.id, {
					metadata: {
						lastChallengeSent: Buffer.from(new Date().toISOString()),
						discoveredAt: Buffer.from(new Date().toISOString()),
					},
				});
			},
		);

		setInterval(async () => {
			await this.checkChallenges();
		}, 60000);
	}

	public dueForChallenge(challenges: Challenge[]) {
		if (challenges.length === 0) {
			return true;
		}

		const lastChallengeEntry = challenges[challenges.length - 1];
		const lastChallengeSent = new Date(lastChallengeEntry.createdAt); // Assuming the challenge has a timestamp field

		return lastChallengeSent.getTime() + 5 * 60 * 1000 <= Date.now(); // 5 minutes ago
	}

	public async checkChallenges() {
		console.log("Checking challenges");

		const peers = await this.components.peerStore.all();

		await Promise.allSettled(
			peers.map(async (peer) => {
				try {
					const challenges = await this.challengeService.getChallenges(peer.id);

					if (!challenges) return; // Handle unexpected null/undefined response

					if (this.dueForChallenge(challenges)) {
						console.log("Due for challenge", peer.id);

						// Create and send challenge
						const challenge = Challenge.decode(
							this.challengeService.createChallenge(),
						);

						//set manager to current peerId

						if (!challenge.task) {
							throw new Error("Task not found in challenge");
						}

						challenge.task.manager = this.components.peerId.toString();

						await this.challengeService.sendChallenge(
							peer.id.toString(),
							challenge,
						);
					} else if (challenges.length > 0) {
						// Check last challenge response time
						const lastChallengeEntry = challenges[challenges.length - 1];

						const CHALLENGE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

						if (
							!lastChallengeEntry.task?.result &&
							new Date(lastChallengeEntry.createdAt).getTime() +
								CHALLENGE_TIMEOUT_MS <=
								Date.now()
						) {
							console.log("Last challenge not responded to in time", peer.id);
						}
					}
				} catch (e) {
					console.error(`Error processing peer ${peer.id}:`, e);
					console.log("Removing peer from store:", peer.id);
					this.components.peerStore.delete(peer.id);
				}
			}),
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

	public async acknowledgeTaskCompletion(task: Task) {
		const { peerId } = extractPeerIdFromTaskResults(task.result);

		if (!peerId) {
			throw new Error("PeerId not found in task result");
		}

		const result = await this.taskService.signTask(
			task,
			this.components.privateKey,
		);

		result.status = TaskStatus.COMPLETED;
		await this.taskService.storeTask(result);
		await this.taskService.sendTask(peerId, result);

		const payment = await this.generatePayment(peerId, result);

		await this.paymentService.sendPayment(peerId, Payment.decode(payment));
	}

	public async processTask(task: Task) {
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

	async generatePayment(peerId: string, task: Task) {
		return await this.paymentService.generatePayment(peerId, task);
	}

	getQueue() {
		console.log("Getting queue");
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
