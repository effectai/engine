import { readFileSync } from "node:fs";
import { Command } from "commander";

export const DEFAULT_CAPABILITY = "effectai/qwen3.2-ai-worker";
export const CAPABILITY_ENV_VAR = "AI_WORKER_CAPABILITY";
export const PRIVATE_KEY_PATH_ENV_VAR = "AI_WORKER_PRIVATE_KEY_PATH";

export type WorkerConfig = {
  capability: string;
  privateKey: Uint8Array;
};

const DEFAULT_PRIVATE_KEY_PATH = "tst8sA9paoprGP987QKSuX9VoHY22AXtB8b3bMTckf4.json";
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

const loadPrivateKeyFromFile = (path: string): Uint8Array => {
  const data = readFileSync(path, "utf-8");
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed)) {
    throw new Error(`Private key file must contain a JSON array: ${path}`);
  }
  return Uint8Array.from(parsed as number[]);
};

export const loadWorkerConfig = (): WorkerConfig => {
  const envCapability = process.env[CAPABILITY_ENV_VAR];
  const envPrivateKeyPath = process.env[PRIVATE_KEY_PATH_ENV_VAR];

  const program = new Command()
    .allowUnknownOption()
    .option(
      "--capability <capability>",
      `Capability identifier to advertise (default: ${DEFAULT_CAPABILITY}). You can also set ${CAPABILITY_ENV_VAR}.`,
    )
    .option(
      "--private-key <path>",
      `Path to private key JSON (Uint8Array). You can also set ${PRIVATE_KEY_PATH_ENV_VAR}.`,
    );

  program.parse(process.argv);
  const options = program.opts<{ capability?: string; privateKey?: string }>();

  const rawCapability =
    typeof options.capability === "string"
      ? options.capability
      : (envCapability ?? DEFAULT_CAPABILITY);

  const privateKeyPath =
    typeof options.privateKey === "string"
      ? options.privateKey
      : (envPrivateKeyPath ?? DEFAULT_PRIVATE_KEY_PATH);

  if (!privateKeyPath) {
    throw new Error("Private key path is required. Provide via --private-key or AI_WORKER_PRIVATE_KEY_PATH.");
  }

  return {
    capability: ensureSingleCapability(rawCapability),
    privateKey: loadPrivateKeyFromFile(privateKeyPath),
  };
};
