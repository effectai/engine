import { type WorkerEntity, Task } from "@effectai/protocol";
import { type BaseDatastore } from "datastore-core";
import type { PrivateKey, Libp2p, Connection } from "@libp2p/interface";
import { createWorker } from "@effectai/protocol";

export type State = {
  // global state
  done: boolean;
  current: "init_p2p" | "init_llm" | "running";
  datastore?: BaseDatastore;
  privateKey?: PrivateKey;

  // worker state
  activeTask?: Task;
  worker?: Awaited<ReturnType<typeof createWorker>>;
};


export const state : State = {
  done: false,
  current: "init_p2p",
};
