import { createWorker, type Task } from "@effectai/protocol";
import type { AutomationBackend } from "./backend/base.js";
import { createConsoleLogger, type Logger } from "./logger.js";

export type State = {
  done: boolean;
  datastore?: Parameters<typeof createWorker>[0]["datastore"];
  privateKey?: Parameters<typeof createWorker>[0]["privateKey"];
  solanaSecretKey?: Uint8Array;
  backend?: AutomationBackend;
  logger: Logger;
  deploymentEndpointUrl?: string;
  activeTask?: Task;
  worker?: Awaited<ReturnType<typeof createWorker>>;
};

export const state: State = {
  done: false,
  logger: createConsoleLogger("worker"),
};
