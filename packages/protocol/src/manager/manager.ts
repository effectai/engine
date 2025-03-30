import {
	TypedEventEmitter,
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	type PeerStore,
	type PrivateKey,
	type Startable,
	type TypedEventTarget,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";

import type {
	Registrar,
	ConnectionManager,
	IncomingStreamData,
} from "@libp2p/interface-internal";
import type { Datastore } from "interface-datastore";

import {
	MULTICODEC_MANAGER_PROTOCOL_NAME,
	MULTICODEC_MANAGER_PROTOCOL_VERSION,
} from "./consts.js";
import { getOrCreateActiveOutBoundStream, isWorker } from "../utils/utils.js";

import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "../worker/consts.js";

import { peerIdFromString } from "@libp2p/peer-id";
import { WorkerQueue } from "./queue.js";
import {
	ManagerPaymentService,
	ManagerSessionService,
	ManagerTaskService,
} from "./modules/index.js";
import { logger } from "../common/logging.js";
import { EffectProtocolMessage, type Task } from "../proto/effect.js";
import { SessionMessageHandler } from "./modules/session/handler.js";
import type { ManagerTask } from "./modules/task/pb/ManagerTask.js";
import {
	TaskAcceptedMessageHandler,
	TaskCompletedMessageHandler,
} from "./modules/task/handler.js";
import { Router } from "../common/router.js";

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
	"task:completed": CustomEvent<Task>;
}

export class ManagerService
	extends TypedEventEmitter<ManagerServiceEvents>
	implements Startable
{
	private readonly workerQueue: WorkerQueue;

	private readonly taskService: ManagerTaskService;
	private readonly paymentService: ManagerPaymentService;
	private readonly sessionService: ManagerSessionService;
	private readonly router = new Router();

	constructor(private components: ManagerServiceComponents) {
		super();

		const paymentService = new ManagerPaymentService(components);
		const taskService = new ManagerTaskService(components);

		this.paymentService = paymentService;
		this.taskService = new ManagerTaskService(components);
		this.workerQueue = new WorkerQueue(components);
		this.sessionService = new ManagerSessionService(components);
	}

	start(): void | Promise<void> {
		this.register();

		this.components.events.addEventListener(
			"peer:identify",
			async ({ detail }) => {
				//check if peer is a worker
				if (isWorker(detail)) {
					try {
						await this.sessionService.pairWorker(detail);
						this.workerQueue.enqueue(detail.peerId.toString());
					} catch (e) {
						console.error("Error pairing worker", e);
					}
				}
			},
		);
	}

	stop(): void | Promise<void> {}

	private async register() {
		this.components.registrar.handle(
			`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			this.router.handleMessage.bind(this),
			{ runOnLimitedConnection: false },
		);

		this.router.register(
			"message",
			"taskAccepted",
			new TaskAcceptedMessageHandler(this.taskService),
		);

		this.router.register(
			"message",
			"taskCompleted",
			new TaskCompletedMessageHandler(
				this.paymentService,
				this.taskService,
				this.sessionService,
			),
		);
	}

	public async onReceiveNewTask(task: Task): Promise<ManagerTask> {
		logger.info("MANAGER: received a task", task);

		//TODO:: check if the task is valid
		//TODO:: check if task can be payed etc.

		//save task in the store
		return await this.taskService.onIncomingTask(task);
	}

	public async manageTasks(): Promise<void> {
		const tasks = await this.taskService.getTasks();

		if (tasks.length === 0) {
			return;
		}

		for (const task of tasks) {
			this.manageTask(task);
		}
	}

	public async manageTask(managerTask: ManagerTask) {
		const worker = this.workerQueue.dequeue();

		if (!worker || !managerTask.task) {
			console.error("No worker available");
			return;
		}

		//assign task to worker
		await this.taskService.assignTask(managerTask, peerIdFromString(worker));

		await this.sessionService.sendMessage(worker, {
			task: managerTask.task,
		});
	}
}

export function managerProtocol(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
