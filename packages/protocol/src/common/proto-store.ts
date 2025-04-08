import {
  type ComponentLogger,
  type Libp2pEvents,
  type PeerId,
  TypedEventEmitter,
  type TypedEventTarget,
} from "@libp2p/interface";
import { type Datastore, Key } from "interface-datastore";

export interface TaskStoreComponents {
  datastore: Datastore;
}

export interface TaskStoreEvents<T> {
  "task:stored": CustomEvent<T>;
}

export interface InitProtostore {
  prefix: string;
  encoder: (value: any) => Uint8Array;
  decoder: (data: Uint8Array) => any;
}

export class ProtoStore<T> extends TypedEventEmitter<TaskStoreEvents<T>> {
  private readonly components: TaskStoreComponents;
  private readonly datastore: Datastore;
  private readonly prefix: string;
  private readonly encoder: (value: T) => Uint8Array;
  private readonly decoder: (data: Uint8Array) => T;

  constructor(components: TaskStoreComponents, init: InitProtostore) {
    super();
    this.components = components;
    this.datastore = this.components.datastore;

    this.prefix = init.prefix;
    this.encoder = init.encoder;
    this.decoder = init.decoder;
  }

  async has(entityId: string): Promise<boolean> {
    return this.datastore.has(new Key(`/${this.prefix}/${entityId}`));
  }

  async get(entityId: string): Promise<T> {
    try {
      return this.decoder(
        await this.datastore.get(new Key(`/${this.prefix}/${entityId}`)),
      );
    } catch (e) {
      console.error("Entity not found");
      throw e;
    }
  }

  async put(entityId: string, entity: T): Promise<Key> {
    return await this.datastore.put(
      new Key(`/${this.prefix}/${entityId}`),
      this.encoder(entity),
    );
  }

  async all(): Promise<T[]> {
    const tasks = [];
    for await (const entry of this.datastore.query({
      prefix: `/${this.prefix}/`,
    })) {
      tasks.push(this.decoder(entry.value));
    }
    return tasks;
  }
}
