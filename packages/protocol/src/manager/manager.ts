import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	type PeerStore,
	type PrivateKey,
	type Startable,
	type TypedEventTarget,
} from "@libp2p/interface";

import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import type { Datastore } from "interface-datastore";

import { isWorker } from "../utils/utils.js";
import {
	MULTICODEC_MANAGER_PROTOCOL_NAME,
	MULTICODEC_MANAGER_PROTOCOL_VERSION,
} from "./consts.js";

import { ProtocolEntity } from "../common/ProtocolEntity.js";
import type {
	PayoutRequest,
	Task,
	TaskAccepted,
	TaskCompleted,
} from "../common/proto/effect.js";
import { type ActionHandler, type MessageHandler } from "../common/router.js";
import {
	ManagerPaymentService,
	ManagerSessionService,
	ManagerTaskService,
} from "./modules/index.js";
import { PaymentPayoutRequestMessageHandler } from "./modules/payments/handlers/payoutRequest.js";
import {
	ManageTaskAction,
	type ManageTaskParams,
} from "./modules/task/actions/manageTask.js";
import {
	OnReceiveNewTaskAction,
	type onReceiveNewTaskParams,
} from "./modules/task/actions/onReceiveNewTask.js";
import { TaskAcceptedMessageHandler } from "./modules/task/handlers/taskAccepted.js";
import { TaskCompletedMessageHandler } from "./modules/task/handlers/taskCompleted.js";
import { ManageTasksAction } from "./modules/task/actions/manageTasks.js";
import { GetTasksAction } from "./modules/task/actions/getTasks.js";
import { ManagerTask } from "./modules/task/pb/ManagerTask.js";
import { logger } from "../common/logging.js";

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

export type ManagerProtocolEvents = {
	"task:received": CustomEvent<Task>;
	"task:completed": CustomEvent<Task>;
};

export type ManagerMessageHandler<
	T,
	E extends ManagerProtocolEvents = ManagerProtocolEvents,
> = MessageHandler<T, E>;

// exposed actions that the manager can perform.
export type ManagerActionsMap = {
	getTasks: ActionHandler<string, ManagerTask[]>;
	onReceiveNewTask: ActionHandler<onReceiveNewTaskParams, void>;
	manageTasks: ActionHandler<undefined, void>;
	manageTask: ActionHandler<ManageTaskParams, void>;
};

// the messages that the manager can interact with.
export type ManagerMessageHandlerMap = {
	taskCompleted: ManagerMessageHandler<TaskCompleted>;
	taskAccepted: ManagerMessageHandler<TaskAccepted>;
	payoutRequest: ManagerMessageHandler<PayoutRequest>;
};

export class ManagerService
	extends ProtocolEntity<
		ManagerMessageHandlerMap,
		ManagerActionsMap,
		ManagerProtocolEvents
	>
	implements Startable
{
	private readonly taskService: ManagerTaskService;
	private readonly paymentService: ManagerPaymentService;
	private readonly sessionService: ManagerSessionService;

	constructor(private components: ManagerServiceComponents) {
		super();

		this.paymentService = new ManagerPaymentService(components);
		this.taskService = new ManagerTaskService(components);
		this.sessionService = new ManagerSessionService(components);
	}

	start(): void | Promise<void> {
		this.register();

		this.components.events.addEventListener(
			"peer:identify",
			async ({ detail }) => {
				logger.info({ detail }, "MANAGER: peer:identied");
				//check if peer is a worker
				if (isWorker(detail)) {
					try {
						await this.sessionService.pairWorker(detail);
					} catch (e) {
						console.error("Error pairing worker", e);
					}
				}
			},
		);
	}

	private async register() {
		this.components.registrar.handle(
			`/${MULTICODEC_MANAGER_PROTOCOL_NAME}/${MULTICODEC_MANAGER_PROTOCOL_VERSION}`,
			this.router.handleMessage.bind(this),
			{ runOnLimitedConnection: false },
		);

		this.router.register(
			"message",
			"payoutRequest",
			new PaymentPayoutRequestMessageHandler(
				this.paymentService,
				this.sessionService,
			),
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

		this.router.register(
			"action",
			"onReceiveNewTask",
			new OnReceiveNewTaskAction(this.taskService),
		);

		this.router.register(
			"action",
			"getTasks",
			new GetTasksAction(this.taskService),
		);

		this.router.register(
			"action",
			"manageTask",
			new ManageTaskAction(this.taskService, this.sessionService),
		);

		this.router.register(
			"action",
			"manageTasks",
			new ManageTasksAction(this.taskService, this.sessionService),
		);
	}

	stop(): void | Promise<void> {}
}

export function managerProtocol(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
