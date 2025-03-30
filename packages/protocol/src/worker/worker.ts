import {
	TypedEventEmitter,
	type Startable,
	type PrivateKey,
	type TypedEventTarget,
	type Libp2pEvents,
	type ComponentLogger,
	type PeerStore,
	type PeerId,
} from "@libp2p/interface";

import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_WORKER_PROTOCOL_NAME,
	MULTICODEC_WORKER_PROTOCOL_VERSION,
} from "./consts.js";

import type { PublicKey } from "@solana/web3.js";

import type { Datastore } from "interface-datastore";

export type WorkerSession = {
	nonce: bigint;
	recipient: PublicKey;
};

import {
	type ActionHandler,
	type MessageHandler,
	Router,
} from "../common/router.js";
import { WorkerTaskService } from "./modules/task/service.js";
import { PaymentMessageHandler } from "./modules/payment/handlers/payment.js";
import { WorkerPaymentService } from "./modules/payment/service.js";
import { WorkerSessionService } from "./modules/session/service.js";
import type { Payment, Task } from "../proto/effect.js";
import {
	AcceptTaskAction,
	type AcceptTaskActionParams,
} from "./modules/task/actions/acceptTask.js";
import { ManagerSessionDataHandler } from "./modules/session/handlers/managerSessionData.js";
import { TaskMessageHandler } from "./modules/task/handlers/task.js";
import {
	CompleteTaskAction,
	CompleteTaskActionParams,
} from "./modules/task/actions/completeTask.js";
import {
	RequestPayoutAction,
	type RequestPayoutActionParams,
	type RequestPayoutActionResult,
} from "./modules/payment/actions/requestPayout.js";
import { ManagerSessionData } from "../common/proto/effect.js";

export interface WorkerProtocolEvents {
	"task:received": CustomEvent<Task>;
	"task:sent": CustomEvent<Task>;
	"payment:received": CustomEvent<Payment>;
	"worker:identify": CustomEvent<WorkerSession>;
}

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
	getTasks: ActionHandler<string, Task[]>;
	acceptTask: ActionHandler<AcceptTaskActionParams, void>;
	completeTask: ActionHandler<CompleteTaskActionParams, void>;
	requestPayout: ActionHandler<
		RequestPayoutActionParams,
		RequestPayoutActionResult
	>;
};

// the messages that the worker can interact with.
type MessagesMap = {
	managerSession: MessageHandler<ManagerSessionData>;
	task: MessageHandler<Task>;
	payment: MessageHandler<Payment>;
};

export class WorkerProtocolService
	extends TypedEventEmitter<WorkerProtocolEvents>
	implements Startable
{
	private router: Router<MessagesMap, ActionsMap>;

	private taskService: WorkerTaskService;
	private paymentService: WorkerPaymentService;
	private sessionService: WorkerSessionService;

	public actions?: {
		[key in keyof ActionsMap]: (
			params: Parameters<ActionsMap[key]["execute"]>[0],
		) => Promise<ReturnType<ActionsMap[key]["execute"]>>;
	};

	constructor(
		private components: WorkerProtocolComponents,
		private init: WorkerProtocolInit,
	) {
		super();

		this.router = new Router();

		this.taskService = new WorkerTaskService(components);
		this.paymentService = new WorkerPaymentService(components);
		this.sessionService = new WorkerSessionService(components);
	}

	start(): void | Promise<void> {
		this.register();
	}

	stop(): void | Promise<void> {}

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
			new RequestPayoutAction(this.components.peerId, this.sessionService),
		);

		//TODO:: fix ts error.
		this.actions = this.router.getActions();
	}
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
