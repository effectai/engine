import type { AsyncLocalStorage } from "node:async_hooks";
import { type Logger, pino } from "pino";

export type Logging = {
  context: AsyncLocalStorage<Record<string, string | number>>;
  log: Logger;
};

export const createLogger = (
  name: string,
  context: AsyncLocalStorage<Record<string, string | number>>,
): Logging => {
  const logger = pino({
    name,
    level: process.env.PINO_LOG_LEVEL || "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    hooks: {
      logMethod(args, method) {
        const store = context.getStore();
        if (args.length > 0) {
          if (isPlainObject(args[0])) {
            args[0] = Object.assign({}, store, args[0]);
          } else if (typeof args[0] === "string") {
            args.unshift({ ...store });
          } else {
            args.unshift({ ...store });
          }
        }
        method.apply(this, args);
      },
    },
  });

  return {
    context,
    log: logger,
  };
};

const isPlainObject = (obj: any): obj is Record<string, any> => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
};