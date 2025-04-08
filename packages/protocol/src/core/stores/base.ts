import { TaskStore } from "./taskStore.js";

// stores.ts
export interface StoreMap {
  taskStore: TaskStore;
  // Add other stores as needed:
  // paymentStore: PaymentStore;
  // workerStore: WorkerStore;
}

export type StoreInitializers<S extends StoreMap> = {
  [K in keyof S]: S[K];
};
