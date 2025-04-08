import { pino } from "pino";

export const logger = pino({
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

export const workerLogger = logger.child({ module: "worker" });
export const managerLogger = logger.child({ module: "manager" });
