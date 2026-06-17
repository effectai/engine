export type Logger = {
  debug: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  error: (message: string, metadata?: Record<string, unknown>) => void;
};

export const createConsoleLogger = (scope: string): Logger => ({
  debug(message, metadata) {
    console.debug(format("DEBUG", scope, message, metadata));
  },
  info(message, metadata) {
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
  const meta = metadata ? ` ${JSON.stringify(metadata)}` : "";
  return `[${level}] [${scope}] ${message}${meta}`;
};
