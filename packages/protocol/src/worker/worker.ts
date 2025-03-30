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
import { CompleteTaskAction } from "./modules/task/actions/completeTask.js";
import {
	RequestPayoutAction,
	type RequestPayoutActionParams,
	type RequestPayoutActionResult,
} from "./modules/payment/actions/requestPayout.js";

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

type ActionsMap = {
	getTasks: ActionHandler<string, Task[]>;
	acceptTask: ActionHandler<AcceptTaskActionParams, boolean>;
	completeTask: ActionHandler<{ taskId: string; result: any }, void>;
	requestPayout: ActionHandler<
		RequestPayoutActionParams,
		RequestPayoutActionResult
	>;
};

type MessagesMap = {
	taskMessageHandler: MessageHandler<Task>;
};

export class WorkerProtocolService
	extends TypedEventEmitter<WorkerProtocolEvents>
	implements Startable
{
	public taskService: WorkerTaskService;
	private paymentService: WorkerPaymentService;
	private sessionService: WorkerSessionService;
	private router: Router<MessagesMap, ActionsMap>;
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

		const messageHandlers = [
			[
				"managerSession",
				new ManagerSessionDataHandler(
					this.components.peerId,
					this.init.onRequestSessionData,
				),
			],
			["task", new TaskMessageHandler(this.taskService)],
			["payment", new PaymentMessageHandler(this.paymentService)],
		] as const;

		const actionHandlers = [
			[
				"acceptTask",
				new AcceptTaskAction(
					this.components.peerId,
					this.taskService,
					this.sessionService,
				),
			],
			[
				"completeTask",
				new CompleteTaskAction(
					this.components.peerId,
					this.taskService,
					this.sessionService,
				),
			],
			[
				"requestPayout",
				new RequestPayoutAction(this.components.peerId, this.sessionService),
			],
		] as const;

		for (const [key, handler] of messageHandlers) {
			this.router.register("message", key, handler);
		}

		for (const [key, handler] of actionHandlers) {
			this.router.register("action", key, handler);
		}

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
