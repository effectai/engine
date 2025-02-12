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
import { Task } from "../../protobufs/task/task.js";
import { type TaskInfo, TaskStore } from "../store/task.js";
import type { Datastore } from "interface-datastore";

export interface ManagerServiceComponents {
	registrar: Registrar;
  peerRouting: PeerRouting;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
	datastore: Datastore;
}

export interface ManagerServiceEvents {
	"task:received": CustomEvent<TaskInfo>;
}

export class ManagerService extends TypedEventEmitter<ManagerServiceEvents> {
	private components: ManagerServiceComponents;
	batchStore: TaskStore;
  peerQueue: PeerId[] = [];

	constructor(components: ManagerServiceComponents) {
		super();
		this.components = components;

		this.batchStore = new TaskStore(components.datastore);
		this._initialize();
	}

	private _initialize() {
		this.components.registrar.handle(
			"/effect-ai/task/1.0.0",
			async (streamData) => {
				const stream = pbStream(streamData.stream).pb(Task);
				const data = await stream.read();

				this.safeDispatchEvent("task:received", { detail: data });
			},
			{ runOnLimitedConnection: false },
		);

		this.addEventListener("task:received", async (taskInfo) => {
			//we received a task from a worker peer.
		});

    this.components.registrar.("peer:discovered", (peerInfo) => {
      this.peerQueue.push(peerInfo.peerId);
    }
	}

	public async sendTask(peerId: PeerId, task: Task) {
		const connection =
			await this.components.connectionManager.openConnection(peerId);

		const stream = await connection.newStream("/effect-ai/task/1.0.0");

		const pb = pbStream(stream).pb(Task);
		await pb.write(task);
	}

	public async processTask(task: Task, repetitions: number) {
     
  }
}

export function managerService(): (
	// init: Partial<TaskManagerInit> = {}
	components: ManagerServiceComponents,
) => ManagerService {
	return (components: ManagerServiceComponents) =>
		new ManagerService(components);
}
