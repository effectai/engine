import {
	type PeerId,
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
} from "@libp2p/interface";
import { pbStream } from "it-protobuf-stream";
import { Task } from "./pb/task.js";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import type { TaskStore } from "../../service/store/task.js";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";

export interface TaskProtocolEvents {
	"task:received": CustomEvent<Task>;
	"task:sent": CustomEvent<Task>;
}

export interface TaskProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	taskStore: TaskStore;
}

export class TaskProtocol
	extends TypedEventEmitter<TaskProtocolEvents>
	implements Startable
{
	private readonly components: TaskProtocolComponents;

	constructor(components: TaskProtocolComponents) {
		super();
		this.components = components;
	}

	async handleProtocol(data: IncomingStreamData): Promise<void> {
		const pb = pbStream(data.stream).pb(Task);
		const task = await pb.read();

		//TODO:: check if task sender matches the peerId
		this.safeDispatchEvent("task:received", { detail: task });
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

	async sendTask(peerId: PeerId, task: Task): Promise<void> {
		//TODO:: check if connection already exists
		const connection =
			await this.components.connectionManager.openConnection(peerId);

		const stream = await connection.newStream(
			`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
		);

		const pb = pbStream(stream).pb(Task);
		await pb.write(task);

		this.safeDispatchEvent("task:sent", { detail: task });
	}
}

export function taskProtocol(): (
	components: TaskProtocolComponents,
) => TaskProtocol {
	return (components: TaskProtocolComponents) => new TaskProtocol(components);
}
