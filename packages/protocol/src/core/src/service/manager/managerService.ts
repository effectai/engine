import { Uint8ArrayList } from "uint8arraylist";
import { pbStream } from "it-protobuf-stream";

import {
	type IncomingStreamData,
	type PeerId,
	PeerInfo,
	type PeerStore,
	TypedEventEmitter,
} from "@libp2p/interface";

import type { Registrar, ConnectionManager } from "@libp2p/interface-internal";
import { Task } from "../../protocol/task/task.js";

export interface ManagerServiceComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
}

export interface ManagerServiceEvents {
	task: (streamData: IncomingStreamData) => void;
}

export class ManagerService extends TypedEventEmitter<ManagerServiceEvents> {
	private components: ManagerServiceComponents;

	constructor(components: ManagerServiceComponents) {
		super();

		this.components = components;
		this._initialize();
	}

	private _initialize() {
		this.components.registrar.handle(
			"/effect-ai/task/1.0.0",
			async (streamData) => {
				const stream = pbStream(streamData.stream).pb(Task);
				const data = await stream.read();
				console.log("Manager: Received task", data);
			},
			{ runOnLimitedConnection: false },
		);
	}

	public async sendTask(peerId: PeerId, task: Task) {
		const connection =
			await this.components.connectionManager.openConnection(peerId);

		const stream = await connection.newStream("/effect-ai/task/1.0.0");

		const pb = pbStream(stream).pb(Task);

		await pb.write(task);
	}
}

export function managerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
