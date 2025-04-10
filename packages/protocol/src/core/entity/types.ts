import type { Datastore } from "interface-datastore";
import { Transport } from "./factory.js";

interface EntityContext {
  datastore: Datastore;
}

interface Entity {
  transports: Transport[];
  context: EntityContext;
}

export type EntityWithTransports<T extends Transport[]> = Entity &
  {
    [K in keyof T]: T[K] extends Transport<infer TMethods> ? TMethods : never;
  }[number];
