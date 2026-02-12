import type { Task } from "@effectai/protocol";
import {
  createNosanaClient,
  NosanaNetwork,
  type Deployment,
  type DeploymentStrategy,
  type JobDefinition,
  type Vault,
  type DeploymentsApi,
  type NosanaClient,
  DeploymentStatus,
} from "@nosana/kit";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { createConsoleLogger, type Logger } from "../logger.js";
import { state } from "../state.js";
import type { AutomationBackend } from "./base.js";

const DEFAULT_MARKET = "97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf";
const DEFAULT_JOB: JobDefinition = {
  version: "0.1",
  type: "container",
  ops: [
    {
      type: "container/run",
      id: "gpt-oss:20b",
      args: {
        image: "docker.io/ollama/ollama:0.15.4",
        expose: [
          {
            port: 11434,
            health_checks: [
              {
                type: "http",
                path: "/api/tags",
                method: "GET",
                expected_status: 200,
                continuous: false,
              },
            ],
          },
        ],
        gpu: true,
        resources: [
          {
            type: "Ollama",
            model: "%%global.variables.MODEL%%",
          },
        ],
      },
    },
  ],
  meta: {
    trigger: "deployment-manager",
    system_requirements: {
      required_vram: 16,
    },
  },
  global: {
    variables: {
      MODEL: "gpt-oss:20b",
    },
  },
};

const DEFAULT_API_BACKEND_URL = "https://dashboard.k8s.prd.nos.ci";
const MIN_VAULT_SOL = 0.001;
const MIN_VAULT_NOS = 10;
const TOPUP_SOL_AMOUNT = 0.01;
const TOPUP_NOS_AMOUNT = 10;
const LAMPORTS_PER_SOL = 1_000_000_000;
const DEPLOYMENT_NAME = "effectai-ai-worker";
const DEPLOYMENT_TIMEOUT_MINUTES = 60;
const DEPLOYMENT_ROTATION_TIME_MINUTES = 45;
const DEPLOYMENT_REPLICAS = 1;
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 24;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createNosanaBackend = async (): Promise<AutomationBackend> => {
  const logger = state.logger ?? createConsoleLogger("nosana-backend");
  const secretKey = state.privateKey?.raw;
  if (!secretKey) {
    throw new Error("Private key not initialized in state");
  }

  const wallet = await createKeyPairSignerFromBytes(secretKey);

  const client = createNosanaClient(NosanaNetwork.MAINNET, {
    wallet,
    api: { backend_url: DEFAULT_API_BACKEND_URL },
  });

  let ready = false;

  const backend: AutomationBackend = {
    id: "nosana-ai-worker",
    isReady: () => ready,
    async init() {
      logger.info("Initializing Nosana backend");

      const vault = await ensureVault({
        client,
        logger,
      });

      const deployments = client.api.deployments as DeploymentsApi;

      await clearDeployments({ deployments, logger });
      const deployment = await ensureDeployment({ deployments, vault, logger });

      ready = true;
      logger.info("Nosana backend ready", {
        deploymentId: deployment.id,
        status: deployment.status,
      });
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
 * - Reuse the first existing vault to avoid multiple vaults per signer.
 * - Create one if none exist.
 * - If balance is below thresholds, attempt a fixed top-up, but only if the wallet
 *   has enough SOL/NOS; otherwise, skip and continue (no throw), so callers can
 *   decide how to proceed.
 */
const ensureVault = async ({ client, logger }: {
  client: NosanaClient;
  logger: Logger;
}): Promise<Vault> => {
  const deployments = client.api.deployments as DeploymentsApi;
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

    const walletSolLamports = await client.solana.getBalance();
    const walletSol = walletSolLamports / LAMPORTS_PER_SOL;
    const walletNos = await client.nos.getBalance();

    if (walletSol < TOPUP_SOL_AMOUNT || walletNos < TOPUP_NOS_AMOUNT) {
      logger.error("Insufficient wallet balance for vault top-up", {
        vault: vault.address,
        required: { SOL: TOPUP_SOL_AMOUNT, NOS: TOPUP_NOS_AMOUNT },
        available: { SOL: walletSol, NOS: walletNos },
      });
      return vault;
    }

    const topup: Record<string, number> = {};
    if (solShort) topup.SOL = TOPUP_SOL_AMOUNT;
    if (nosShort) topup.NOS = TOPUP_NOS_AMOUNT;

    try {
      await vault.topup(topup);
      logger.info("Triggered vault top-up", {
        vault: vault.address,
        topup,
      });
    } catch (error: unknown) {
      logger.error("Vault top-up failed", { vault: vault.address, error});
    }
  } else {
    logger.info("Vault balance healthy", { vault: vault.address, balance });
  }

  return vault;
};

const clearDeployments = async ({ deployments, logger }: {
  deployments: DeploymentsApi;
  logger: Logger;
}): Promise<void> => {
  const all = await deployments.list();
  if (all.length === 0) {
    logger.info("No existing deployments to stop");
    return;
  }

  for (const d of all) {
    if (d.status === DeploymentStatus.RUNNING) {
      logger.info("Stopping running deployment", { deploymentId: d.id, status: d.status });
      try {
        await d.stop();
        logger.info("Stop requested", { deploymentId: d.id });
        await waitForStatus({ deployments, deploymentId: d.id, target: DeploymentStatus.STOPPED, logger });
      } catch (error: unknown) {
        logger.error("Failed to stop deployment", { deploymentId: d.id, error });
      }
    } else {
      logger.info("Skipping deployment (not running)", { deploymentId: d.id, status: d.status });
    }
  }
};

/**
 * Create a fresh deployment using the configured vault and job definition.
 * - Always create new (cleanup logic only stops RUNNING ones elsewhere).
 * - Wait for RUNNING status, then poll the exposed Ollama endpoint (/api/tags) for HTTP 200
 *   before marking ready.
 */
const ensureDeployment = async ({ deployments, vault, logger }: {
  deployments: DeploymentsApi;
  vault: Vault;
  logger: Logger;
}): Promise<Deployment> => {
  const deployment = await deployments.create({
    name: DEPLOYMENT_NAME,
    market: DEFAULT_MARKET,
    replicas: DEPLOYMENT_REPLICAS,
    timeout: DEPLOYMENT_TIMEOUT_MINUTES,
    strategy: "INFINITE",
    vault: vault.address,
    job_definition: DEFAULT_JOB,
  });

  logger.info("Created deployment", { deploymentId: deployment.id, status: deployment.status });

  await deployment.start();
  logger.info("Start requested", { deploymentId: deployment.id });

  const healthy = await waitForStatus({ deployments, deploymentId: deployment.id, target: DeploymentStatus.RUNNING, logger });
  if (!healthy) {
    throw new Error("Deployment did not reach RUNNING state in time");
  }

  const endpointHealthy = await waitForEndpointHealthy({ deployments, deploymentId: deployment.id, logger });
  if (!endpointHealthy) {
    throw new Error("Deployment endpoint did not become healthy in time");
  }

  return deployment;
};

const waitForStatus = async ({ deployments, deploymentId, target, logger }: {
  deployments: DeploymentsApi;
  deploymentId: string;
  target: DeploymentStatus;
  logger: Logger;
}): Promise<boolean> => {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    const fresh = await deployments.get(deploymentId);

    logger.info("Deployment status", { deploymentId: deploymentId, status: fresh.status, attempt });

    if (fresh.status === target) {
      return true;
    }

    if (fresh.status === DeploymentStatus.ERROR || fresh.status === DeploymentStatus.INSUFFICIENT_FUNDS) {
      logger.error("Deployment entered error state", { deploymentId: deploymentId, status: fresh.status });
      return false;
    }

    await delay(POLL_INTERVAL_MS);
  }

  return false;
};

const waitForEndpointHealthy = async ({ deployments, deploymentId, logger }: {
  deployments: DeploymentsApi;
  deploymentId: string;
  logger: Logger;
}): Promise<boolean> => {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    const fresh = await deployments.get(deploymentId);
    const endpoint = fresh.endpoints?.[0];

    if (!endpoint?.url) {
      logger.warn("No endpoint yet", { deploymentId, attempt });
      await delay(POLL_INTERVAL_MS);
      continue;
    }

    const url = `${endpoint.url}/api/tags`;
    try {
      const res = await fetch(url, { method: "GET", redirect: "manual" });
      if (res.status === 200) {
        logger.info("Endpoint healthy", { deploymentId, url, status: res.status });
        return true;
      }
      logger.warn("Endpoint not ready", { deploymentId, url, status: res.status });
    } catch (error: unknown) {
      logger.warn("Endpoint check failed", { deploymentId, url, error });
    }

    await delay(POLL_INTERVAL_MS);
  }

  return false;
};
