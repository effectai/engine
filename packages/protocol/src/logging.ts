import { pino } from "pino";
import type { Logger } from "pino";

export const baseLogger = pino({
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true, // Enable colors
      translateTime: "HH:MM:ss", // Human-readable time
      ignore: "pid,hostname", // Remove unnecessary fields
    },
  },
});

export const logger: Logger = baseLogger;
export const workerLogger: Logger = baseLogger.child({ module: "worker" });
export const managerLogger: Logger = baseLogger.child({ module: "manager" });
