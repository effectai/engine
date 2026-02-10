import { Command } from "commander";

export const DEFAULT_CAPABILITY = "effectai/qwen3.2-ai-worker";
export const CAPABILITY_ENV_VAR = "AI_WORKER_CAPABILITY";

export type WorkerConfig = {
  capability: string;
};

const MULTI_CAPABILITY_PATTERN = /[,;|]/;

const ensureSingleCapability = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error("Capability must be provided as a string.");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Capability cannot be empty.");
  }

  if (MULTI_CAPABILITY_PATTERN.test(trimmed) || /\s/.test(trimmed)) {
    throw new Error(
      `Multiple capabilities detected in "${value}". Provide exactly one capability value.`,
    );
  }

  return trimmed;
};

export const loadWorkerConfig = (): WorkerConfig => {
  const envCapability = process.env[CAPABILITY_ENV_VAR];

  const program = new Command()
    .allowUnknownOption()
    .option(
      "--capability <capability>",
      `Capability identifier to advertise (default: ${DEFAULT_CAPABILITY}). You can also set ${CAPABILITY_ENV_VAR}.`,
    );

  program.parse(process.argv);
  const options = program.opts<{ capability?: string }>();

  const rawCapability =
    typeof options.capability === "string"
      ? options.capability
      : (envCapability ?? DEFAULT_CAPABILITY);

  return {
    capability: ensureSingleCapability(rawCapability),
  };
};
