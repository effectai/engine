import {
	type ComponentLogger,
	type Libp2pEvents,
	type PeerId,
	TypedEventEmitter,
	type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";
import { Task as Batch } from "../../protobufs/task/task.js";

export interface BatchStoreComponents {
	datastore: Datastore;
	events: TypedEventTarget<Libp2pEvents>;
	logger: ComponentLogger;
}

export class BatchStore extends TypedEventEmitter<Libp2pEvents> {
	private readonly datastore: Datastore;

	constructor(dataStore: Datastore) {
		super();
		this.datastore = dataStore;
	}

	async has(taskId: string): Promise<boolean> {
		return this.datastore.has(new Key(taskId));
	}

	async get(taskId: string): Promise<Batch | undefined> {
		return Batch.decode(await this.datastore.get(new Key(taskId)));
	}

	async put(batch: Batch, sender: PeerId): Promise<Batch> {
		await this.datastore.put(new Key(batch.id), Batch.encode(batch));
		return batch;
	}
}
