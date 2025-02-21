import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { getActiveOutBoundConnections } from "../../utils.js";
import { Payment } from "./pb/payment.js";

export interface TaskProtocolEvents {}

export interface TaskProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
}

export class PaymentProtocolService
	extends TypedEventEmitter<TaskProtocolEvents>
	implements Startable
{
	private readonly components: TaskProtocolComponents;

	constructor(components: TaskProtocolComponents) {
		super();
		this.components = components;
	}

	async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(Payment);
		const task = await pb.read();
	}

	async start(): Promise<void> {
		this.components.registrar.handle(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			this.handleProtocol.bind(this),
			{ runOnLimitedConnection: false },
		);
	}

	stop(): void | Promise<void> {
		// throw new Error("Method not implemented.");
	}
}

export function paymentProtocol(): (
	components: TaskProtocolComponents,
) => PaymentProtocolService {
	return (components: TaskProtocolComponents) =>
		new PaymentProtocolService(components);
}
