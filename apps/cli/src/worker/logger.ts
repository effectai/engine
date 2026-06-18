export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export type Logger = {
  debug: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  error: (message: string, metadata?: Record<string, unknown>) => void;
};

export const createConsoleLogger = (scope: string, minLevel: LogLevel = "info"): Logger => ({
  debug(message, metadata) {
    if (LOG_LEVELS[minLevel] > LOG_LEVELS.debug) return;
    console.debug(format("DEBUG", scope, message, metadata));
  },
  info(message, metadata) {
    if (LOG_LEVELS[minLevel] > LOG_LEVELS.info) return;
    console.info(format("INFO", scope, message, metadata));
  },
  warn(message, metadata) {
    console.warn(format("WARN", scope, message, metadata));
  },
  error(message, metadata) {
    console.error(format("ERROR", scope, message, metadata));
  },
});

const format = (
  level: string,
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
): string => {
  const meta = metadata
    ? ` ${JSON.stringify(metadata, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      )}`
    : "";
  return `[${level}] [${scope}] ${message}${meta}`;
};
