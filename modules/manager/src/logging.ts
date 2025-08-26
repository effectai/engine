import type { AsyncLocalStorage } from "node:async_hooks";
import { type Logger, pino } from "pino";

const __dirname = import.meta.dirname;

export type Logging = {
  context: AsyncLocalStorage<Record<string, string | number>>;
  log: Logger;
};

//@ts-ignore
const transport = pino.transport({
  targets: [
    {
      target: "pino/file",
      options: { destination: `${__dirname}/manager.log` },
    },

    {
      target: "pino/file",
    },
  ],
});

export const createLogger = (
  name: string,
  context: AsyncLocalStorage<Record<string, string | number>>,
): Logging => {
  const logger = pino(
    {
      name,
      level: process.env.PINO_LOG_LEVEL || "info",
      timestamp: pino.stdTimeFunctions.isoTime,
      hooks: {
        logMethod(args, method) {
          const store = context.getStore();
          if (args.length > 0) {
            // if first arg is object, merge with store.
            if (isPlainObject(args[0])) {
              args[0] = Object.assign({}, store, args[0]);
            }
            // if first arg is a string, prepend store as an object.
            else if (typeof args[0] === "string") {
              args.unshift({ ...store });
            } else {
              args.unshift({ ...store });
            }
          }
          method.apply(this, args);
        },
      },
    },
    transport,
  );

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
