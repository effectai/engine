import {
	TypedEventEmitter,
	type Startable,
	type PrivateKey,
	type TypedEventTarget,
	type Libp2pEvents,
	type ComponentLogger,
	type PeerStore,
	type PeerId,
	Libp2p,
} from "@libp2p/interface";

import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "./consts.js";

import type { Datastore } from "interface-datastore";

import {
	type ActionHandler,
	type MessageHandler,
	Router,
} from "../common/router.js";
import { WorkerTaskService } from "./modules/task/service.js";
import { PaymentMessageHandler } from "./modules/payment/handlers/payment.js";
import { WorkerPaymentService } from "./modules/payment/service.js";
import {
	type WorkerSession,
	WorkerSessionService,
} from "./modules/session/service.js";
import type {
	Payment,
	Task,
	WorkerSessionData,
} from "../common/proto/effect.js";
import {
	AcceptTaskAction,
	type AcceptTaskActionParams,
} from "./modules/task/actions/acceptTask.js";
import { ManagerSessionDataHandler } from "./modules/session/handlers/managerSessionData.js";
import { TaskMessageHandler } from "./modules/task/handlers/task.js";
import {
	CompleteTaskAction,
	type CompleteTaskActionParams,
} from "./modules/task/actions/completeTask.js";
import {
	RequestPayoutAction,
	type RequestPayoutActionParams,
	type RequestPayoutActionResult,
} from "./modules/payment/actions/requestPayout.js";
import type { ManagerSessionData } from "../common/proto/effect.js";
import { ProtocolEntity } from "../common/ProtocolEntity.js";
import { GetTasksAction } from "./modules/task/actions/getTasks.js";
import { WorkerTask } from "./modules/task/pb/WorkerTask.js";
import { GetPaymentsAction } from "./modules/payment/actions/getPayments.js";
import {
	RequestPaymentProof,
	RequestProofActionParams,
	RequestProofActionResult,
} from "./modules/payment/actions/requestProof.js";

export type WorkerProtocolEvents = {
	"task:received": CustomEvent<Task>;
	"task:sent": CustomEvent<Task>;
	"payment:received": CustomEvent<Payment>;
};

export type WorkerMessageHandler<
	T,
	E extends WorkerProtocolEvents = WorkerProtocolEvents,
> = MessageHandler<T, E>;

export interface WorkerProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
	datastore: Datastore;
	peerStore: PeerStore;
	peerId: PeerId;
	privateKey: PrivateKey;
}

// the actions that the worker can perform.
export type ActionsMap = {
	getTasks: ActionHandler<void, WorkerTask[]>;
	getPayments: ActionHandler<void, Payment[]>;
	acceptTask: ActionHandler<AcceptTaskActionParams, void>;
	completeTask: ActionHandler<CompleteTaskActionParams, void>;
	requestPayout: ActionHandler<
		RequestPayoutActionParams,
		RequestPayoutActionResult
	>;
	requestProof: ActionHandler<
		RequestProofActionParams,
		RequestProofActionResult
	>;
};

// the messages that the worker can interact with.
export type MessageHandlerMap = {
	managerSession: WorkerMessageHandler<ManagerSessionData>;
	task: WorkerMessageHandler<Task>;
	payment: WorkerMessageHandler<Payment>;
};

export class WorkerProtocolService
	extends ProtocolEntity<MessageHandlerMap, ActionsMap, WorkerProtocolEvents>
	implements Startable
{
	protected taskService: WorkerTaskService;
	protected paymentService: WorkerPaymentService;
	protected sessionService: WorkerSessionService;
	public events: TypedEventTarget<Libp2pEvents>;

	constructor(
		private components: WorkerProtocolComponents,
		private init: WorkerProtocolInit,
	) {
		super();

		this.router = new Router();

		this.taskService = new WorkerTaskService(components);
		this.paymentService = new WorkerPaymentService(components);
		this.sessionService = new WorkerSessionService(components);

		this.events = components.events;
	}

	start(): void | Promise<void> {
		this.register();
	}

	async register() {
		this.components.registrar.handle(
			`/${MULTICODEC_WORKER_PROTOCOL_NAME}/${MULTICODEC_WORKER_PROTOCOL_VERSION}`,
			this.router.handleMessage.bind(this),
			{ runOnLimitedConnection: false },
		);

		this.router.register(
			"message",
			"managerSession",
			new ManagerSessionDataHandler(
				this.components.peerId,
				this.init.onRequestSessionData,
			),
		);

		this.router.register(
			"message",
			"task",
			new TaskMessageHandler(this.taskService),
		);

		this.router.register(
			"message",
			"payment",
			new PaymentMessageHandler(this.paymentService),
		);

		this.router.register(
			"action",
			"acceptTask",
			new AcceptTaskAction(
				this.components.peerId,
				this.taskService,
				this.sessionService,
			),
		);

		this.router.register(
			"action",
			"completeTask",
			new CompleteTaskAction(
				this.components.peerId,
				this.taskService,
				this.sessionService,
			),
		);

		this.router.register(
			"action",
			"requestPayout",
			new RequestPayoutAction(
				this.components.peerId,
				this.sessionService,
				this.paymentService,
			),
		);

		this.router.register(
			"action",
			"getTasks",
			new GetTasksAction(this.taskService),
		);

		this.router.register(
			"action",
			"getPayments",
			new GetPaymentsAction(this.paymentService),
		);

		this.router.register(
			"action",
			"requestProof",
			new RequestPaymentProof(this.components.peerId, this.sessionService),
		);
	}

	stop(): void | Promise<void> {}
}

type WorkerProtocolInit = {
	onRequestSessionData?: (
		peerId: string,
		pubX: Uint8Array,
		pubY: Uint8Array,
	) => Promise<WorkerSession>;
};

export function workerProtocol(
	init: WorkerProtocolInit = {},
): (components: WorkerProtocolComponents) => WorkerProtocolService {
	return (components: WorkerProtocolComponents) =>
		new WorkerProtocolService(components, init);
}
