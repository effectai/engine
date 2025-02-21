import {
	TypedEventEmitter,
	type IncomingStreamData,
	type Startable,
	type PrivateKey,
} from "@libp2p/interface";

import { pbStream } from "it-protobuf-stream";
import { Task } from "./pb/task.js";
import type { ConnectionManager, Registrar } from "@libp2p/interface-internal";
import {
	MULTICODEC_TASK_PROTOCOL_NAME,
	MULTICODEC_TASK_PROTOCOL_VERSION,
} from "./consts.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { getActiveOutBoundConnections } from "../../utils.js";
import { TaskStore } from "./store.js";

export interface TaskProtocolEvents {
	"task:received": CustomEvent<Task>;
	"task:sent": CustomEvent<Task>;
}

export interface TaskProtocolComponents {
	registrar: Registrar;
	connectionManager: ConnectionManager;
	taskStore: TaskStore;
}

export class TaskProtocolService
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

	async sendTask(peerId: string, task: Task): Promise<void> {
		try {
			const peer = peerIdFromString(peerId);

			let [connection] = await getActiveOutBoundConnections(
				this.components.connectionManager,
				peer,
			);

			if (!connection) {
				connection =
					await this.components.connectionManager.openConnection(peer);
			}

			const stream = await connection.newStream(
				`/${MULTICODEC_TASK_PROTOCOL_NAME}/${MULTICODEC_TASK_PROTOCOL_VERSION}`,
			);

			const pb = pbStream(stream).pb(Task);
			await pb.write(task);

			this.safeDispatchEvent("task:sent", { detail: task });
		} catch (e) {
			console.error("Error sending task", e);
		}
	}

	async signTask(task: Task, privateKey: PrivateKey): Promise<Task> {
		//TODO:: we are signing the result here, but we should sign the entire task ?
		const message = Buffer.from(task.result);
		const signature = await privateKey.sign(message);
		task.signature = Buffer.from(signature).toString("hex");
		return task;
	}
}

export function taskProtocol(): (
	components: TaskProtocolComponents,
) => TaskProtocolService {
	return (components: TaskProtocolComponents) =>
		new TaskProtocolService(components);
}
