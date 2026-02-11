import type { Task } from "@effectai/protocol";
import {
  createNosanaClient,
  NosanaNetwork,
  type Deployment,
  type DeploymentStrategy,
  type JobDefinition,
  type Vault,
  type DeploymentsApi,
} from "@nosana/kit";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { createConsoleLogger, type Logger } from "../logger.js";
import { state } from "../state.js";
import type { AutomationBackend } from "./base.js";

const DEFAULT_MARKET = "97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf";
const DEFAULT_JOB: JobDefinition = {
  ops: [
    {
      id: "Qwen3",
      args: {
        gpu: true,
        image: "docker.io/ollama/ollama:0.12.0",
        expose: [
          {
            port: 11434,
            health_checks: [
              {
                path: "/api/tags",
                type: "http",
                method: "GET",
                continuous: false,
                expected_status: 200,
              },
            ],
          },
        ],
        resources: [
          {
            type: "Ollama",
            model: "%%global.variables.MODEL%%",
          },
        ],
      },
      type: "container/run",
    },
  ],
  meta: {
    trigger: "dashboard",
    system_requirements: {
      required_vram: 10,
    },
  },
  type: "container",
  global: {
    variables: {
      MODEL: "qwen3:8b",
    },
  },
  version: "0.1",
};

const DEFAULT_API_BACKEND_URL = "https://dashboard.k8s.prd.nos.ci";
const MIN_VAULT_SOL = 0.001;
const MIN_VAULT_NOS = 0;
const TOPUP_SOL_AMOUNT = 0.01;
const TOPUP_NOS_AMOUNT = 5;

export const createNosanaBackend = async (): Promise<AutomationBackend> => {
  const logger = state.logger;
  const secretKey = state.privateKey?.raw;
  if (!secretKey) {
    throw new Error("Private key not initialized in state");
  }

  const wallet = await createKeyPairSignerFromBytes(secretKey);

  const client = createNosanaClient(NosanaNetwork.MAINNET, {
    wallet,
    api: { backend_url: DEFAULT_API_BACKEND_URL },
  });

  const backend: AutomationBackend = {
    id: "nosana-ai-worker",
    isReady: () => false,
    async init() {
      logger.info("Initializing Nosana backend");

      const deployments = client.api.deployments as DeploymentsApi;

      const vault = await ensureVault({ deployments, logger });
    },
    async execute(task: Task) {
      logger.warn("Nosana backend execute not wired", { taskId: task.id });
      throw new Error("Nosana execute not implemented");
    },
  };

  state.backend = backend;

  return backend;
};

/**
 * Ensure a Nosana vault exists and has a healthy balance.
 * If no vault exists, one is created. If balance is below minimums, a fixed top-up is sent.
 */
const ensureVault = async ({ deployments, logger }: {
  deployments: DeploymentsApi;
  logger: Logger;
}): Promise<Vault> => {
  const existing = await deployments.vaults.list();
  const vault = existing[0] ?? (await deployments.vaults.create());

  if (existing.length > 0) {
    logger.info("Using existing Nosana vault", { vault: vault.address, totalVaults: existing.length });
  } else {
    logger.info("Created new Nosana vault", { vault: vault.address });
  }

  const balance = await vault.getBalance();
  const solShort = balance.SOL < MIN_VAULT_SOL;
  const nosShort = balance.NOS < MIN_VAULT_NOS;

  if (solShort || nosShort) {
    logger.warn("Vault requires top-up", { vault: vault.address, balance });
    try {
      await vault.topup({ SOL: TOPUP_SOL_AMOUNT, NOS: TOPUP_NOS_AMOUNT });
      logger.info("Triggered vault top-up", {
        vault: vault.address,
        topup: { SOL: TOPUP_SOL_AMOUNT, NOS: TOPUP_NOS_AMOUNT },
      });
    } catch (error: unknown) {
      logger.error("Vault top-up failed", { vault: vault.address, error});
    }
  } else {
    logger.info("Vault balance healthy", { vault: vault.address, balance });
  }

  return vault;
};

