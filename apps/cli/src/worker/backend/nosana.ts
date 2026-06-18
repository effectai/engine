import type { Task } from "@effectai/protocol";
import type {
  Deployment,
  DeploymentsApi,
  JobDefinition,
  NosanaClient,
  Vault,
} from "@nosana/kit";
import type { Logger } from "../logger.js";
import { state } from "../state.js";
import type { AutomationBackend } from "./base.js";

export type NosanaBackendConfig = {
  apiBackendUrl: string;
  market: string;
  model: string;
  image: string;
  deploymentName: string;
  replicas: number;
  timeoutMinutes: number;
  endpointTimeoutSeconds: number;
  clearDeployments: boolean;
  listDeploymentsOnly: boolean;
};

type NosanaKit = typeof import("@nosana/kit");

const MIN_VAULT_SOL = 0.008;
const MIN_VAULT_NOS = 20;
const TOPUP_SOL_AMOUNT = 0.01;
const TOPUP_NOS_AMOUNT = 30;
const LAMPORTS_PER_SOL = 1_000_000_000;
const POLL_INTERVAL_MS = 5_000;
const DEPLOYMENT_STATUS_MAX_ATTEMPTS = 36;
const INFERENCE_MAX_ATTEMPTS = 3;
const SYSTEM_PROMPT = `You are the Effect Tasks AI worker.
Process tasks promptly, and follow instructions precisely.`;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loadNosanaKit = async (): Promise<NosanaKit> => {
  try {
    return await import("@nosana/kit");
  } catch (error) {
    throw new Error(
      'The Nosana worker backend requires optional dependency @nosana/kit. ' +
	'Install optional dependencies before running `worker start nosana`.' +
	`Cause: ${error}`,
    );
  }
};

const buildJobDefinition = ({ model, image }: NosanaBackendConfig): JobDefinition => ({
  version: "0.1",
  type: "container",
  ops: [
    {
      type: "container/run",
      id: model,
      args: {
        image,
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
      MODEL: model,
    },
  },
});

const parseInferenceResponse = (data: unknown): string => {
  if (typeof data !== "object" || !data) {
    return "";
  }

  const payload = data as { message?: { content?: string }; response?: string };
  return payload.message?.content ?? payload.response ?? "";
};

const runInference = async ({
  endpointUrl,
  logger,
  context,
  prompt,
  model,
}: {
  endpointUrl: string;
  logger: Logger;
  context: string;
  prompt: string;
  model: string;
}): Promise<string> => {
  const url = `${endpointUrl}/api/chat`;
  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    stream: false,
  };

  for (let attempt = 0; attempt < INFERENCE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        logger.warn("Inference request failed", { context, status: res.status, attempt });
        await delay(POLL_INTERVAL_MS);
        continue;
      }

      const data = (await res.json()) as unknown;
      const message = parseInferenceResponse(data);
      if (!message) {
        logger.warn("Inference response missing content", { context, attempt });
        await delay(POLL_INTERVAL_MS);
        continue;
      }

      return message;
    } catch (error: unknown) {
      logger.warn("Inference request error", { context, attempt, error });
      await delay(POLL_INTERVAL_MS);
    }
  }

  throw new Error("Inference did not succeed after retries");
};

export const createNosanaBackend = async (config: NosanaBackendConfig)
  : Promise<AutomationBackend> => {
  const logger = state.logger;
  const secretKey = state.solanaSecretKey;
  if (!secretKey) {
    throw new Error("Solana secret key not initialized in state");
  }

  const {
    createNosanaClient,
    NosanaNetwork,
    DeploymentStatus,
    createWalletFromBytes,
  } = await loadNosanaKit();
  const wallet = await createWalletFromBytes(secretKey);

  const client = createNosanaClient(NosanaNetwork.MAINNET, {
    wallet,
    api: { backend_url: config.apiBackendUrl },
  });

  let ready = false;
  let cachedEndpointUrl: string | undefined;
  let deployments: DeploymentsApi | undefined;
  let createdDeploymentId: string | undefined;

  const backend: AutomationBackend = {
    id: "nosana-ai-worker",
    isReady: () => ready,
    async init() {
      logger.info("Initializing Nosana backend");

      deployments = client.api.deployments as DeploymentsApi;

      if (config.listDeploymentsOnly) {
        await listRunningDeployments({ deployments, logger });
        ready = true;
        state.done = true;
        return;
      }

      if (config.clearDeployments) {
        await clearDeployments({ deployments, logger, DeploymentStatus });
        ready = true;
        logger.info("Cleared existing deployments; exiting.");
        state.done = true;
        return;
      }

      const vault = await ensureVault({ client, logger });
      await clearDeployments({ deployments, logger, DeploymentStatus });

      const { deployment, endpointUrl } = await ensureDeployment({
        deployments,
        vault,
        logger,
        config,
        DeploymentStatus,
      });
      cachedEndpointUrl = endpointUrl;
      state.deploymentEndpointUrl = endpointUrl;
      createdDeploymentId = deployment.id;

      ready = true;
      logger.info("Nosana backend ready", {
        deploymentId: deployment.id,
        status: deployment.status,
      });
    },
    async execute(task: Task, template?: string) {
      if (!cachedEndpointUrl) {
        throw new Error("Deployment endpoint not ready for inference");
      }

      const prompt = [task.title, task.templateData, template]
        .filter(Boolean)
        .join("\n");
      return runInference({
        endpointUrl: cachedEndpointUrl,
        logger,
        context: `task:${task.id}`,
        prompt,
        model: config.model,
      });
    },
    async cleanup() {
      if (!deployments || !createdDeploymentId) return;

      logger.info("Stopping deployment", { deploymentId: createdDeploymentId });
      try {
        const d = await deployments.get(createdDeploymentId);
        await d.stop();
        logger.info("Deployment stopped", { deploymentId: createdDeploymentId });
      } catch (error: unknown) {
        logger.error("Failed to stop deployment", { deploymentId: createdDeploymentId, error });
      }
    },
  };

  return backend;
};

const ensureVault = async ({ client, logger }: {
  client: NosanaClient;
  logger: Logger;
}): Promise<Vault> => {
  const deployments = client.api.deployments as DeploymentsApi;
  const existing = await deployments.vaults.list();
  const vault = existing[0] ?? (await deployments.vaults.create());

  if (existing.length > 0) {
    logger.info(
      "Using existing Nosana vault",
      { vault: vault.address, totalVaults: existing.length }
    );
  } else {
    logger.info("Created new Nosana vault", { vault: vault.address });
  }

  const balance = await vault.getBalance();
  const solShort = balance.SOL < MIN_VAULT_SOL;
  const nosShort = balance.NOS < MIN_VAULT_NOS;

  if (solShort || nosShort) {
    logger.warn("Vault requires top-up", { vault: vault.address, balance });

    const walletSolLamports = await client.solana.getBalance();
    const walletSol = Number(walletSolLamports) / LAMPORTS_PER_SOL;
    const walletNos = await client.nos.getBalance();

    if (walletSol < TOPUP_SOL_AMOUNT || walletNos < TOPUP_NOS_AMOUNT) {
      logger.error("Insufficient wallet balance for vault top-up", {
        vault: vault.address,
        required: { SOL: TOPUP_SOL_AMOUNT, NOS: TOPUP_NOS_AMOUNT },
        available: { SOL: walletSol, NOS: walletNos },
      });
      throw new Error(
        [
          "Nosana vault needs funding before the worker can start.",
          `Vault: ${vault.address}`,
          `Vault balance: ${balance.SOL} SOL, ${balance.NOS} NOS`,
          'Required wallet balance for top-up: ' +
	    `${TOPUP_SOL_AMOUNT} SOL, ${TOPUP_NOS_AMOUNT} NOS`,
          `Available wallet balance: ${walletSol} SOL, ${walletNos} NOS`,
          "Top up the worker wallet or vault and try again.",
        ].join("\n"),
      );
    }

    const topup: Record<string, number> = {};
    if (solShort) topup.SOL = TOPUP_SOL_AMOUNT;
    if (nosShort) topup.NOS = TOPUP_NOS_AMOUNT;

    try {
      await vault.topup(topup);
      logger.info("Triggered vault top-up", { vault: vault.address, topup });
    } catch (error: unknown) {
      logger.error("Vault top-up failed", { vault: vault.address, error });
    }
  } else {
    logger.info("Vault balance healthy", { vault: vault.address, balance });
  }

  return vault;
};

const listRunningDeployments = async ({ deployments, logger }: {
  deployments: DeploymentsApi;
  logger: Logger;
}): Promise<void> => {
  const { deployments: all } = await deployments.list();
  const running = all.filter((deployment) => deployment.status === "RUNNING");

  logger.info("Running Nosana deployments", { count: running.length });
  for (const deployment of running) {
    console.log(JSON.stringify({
      id: deployment.id,
      name: deployment.name,
      status: deployment.status,
      vault: deployment.vault?.address,
      market: deployment.market,
      endpoints: deployment.endpoints,
      created_at: deployment.created_at,
      updated_at: deployment.updated_at,
    }, null, 2));
  }
};

const clearDeployments = async ({ deployments, logger, DeploymentStatus }: {
  deployments: DeploymentsApi;
  logger: Logger;
  DeploymentStatus: NosanaKit["DeploymentStatus"];
}): Promise<void> => {
  const { deployments: all } = await deployments.list();
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
        await waitForStatus({
	  deployments,
	  deploymentId: d.id,
	  target: DeploymentStatus.STOPPED,
	  logger,
	  DeploymentStatus
	});
      } catch (error: unknown) {
        logger.error("Failed to stop deployment", { deploymentId: d.id, error });
      }
    } else {
      logger.debug("Skipping deployment (not running)", { deploymentId: d.id, status: d.status });
    }
  }
};

const ensureDeployment = async ({ deployments, vault, logger, config, DeploymentStatus }: {
  deployments: DeploymentsApi;
  vault: Vault;
  logger: Logger;
  config: NosanaBackendConfig;
  DeploymentStatus: NosanaKit["DeploymentStatus"];
}): Promise<{ deployment: Deployment; endpointUrl: string }> => {
  const deployment = await deployments.create({
    name: config.deploymentName,
    market: config.market,
    replicas: config.replicas,
    timeout: config.timeoutMinutes,
    strategy: "INFINITE",
    vault: vault.address,
    job_definition: buildJobDefinition(config),
  });

  logger.info(
    "Created deployment",
    { deploymentId: deployment.id, status: deployment.status }
  );

  await deployment.start();
  logger.info("Start requested", { deploymentId: deployment.id });

  const healthy = await waitForStatus({
    deployments,
    deploymentId: deployment.id,
    target: DeploymentStatus.RUNNING,
    logger,
    DeploymentStatus
  });
  if (!healthy) {
    throw new Error("Deployment did not reach RUNNING state in time");
  }

  const endpointUrl = await waitForEndpointHealthy({
    deployments,
    deploymentId: deployment.id,
    logger,
    timeoutSeconds: config.endpointTimeoutSeconds,
  });
  if (!endpointUrl) {
    throw new Error("Deployment endpoint did not become healthy in time");
  }

  return { deployment, endpointUrl };
};

const waitForStatus = async ({
  deployments,
  deploymentId,
  target,
  logger,
  DeploymentStatus
}: {
  deployments: DeploymentsApi;
  deploymentId: string;
  target: string;
  logger: Logger;
  DeploymentStatus: NosanaKit["DeploymentStatus"];
}): Promise<boolean> => {
  for (let attempt = 0; attempt < DEPLOYMENT_STATUS_MAX_ATTEMPTS; attempt += 1) {
    const fresh = await deployments.get(deploymentId);

    logger.debug("Deployment status", { deploymentId, status: fresh.status, attempt });

    if (fresh.status === target) {
      return true;
    }

    if (fresh.status === DeploymentStatus.ERROR ||
      fresh.status === DeploymentStatus.INSUFFICIENT_FUNDS) {
      logger.error(
	"Deployment entered error state",
	{ deploymentId, status: fresh.status }
      );
      return false;
    }

    await delay(POLL_INTERVAL_MS);
  }

  return false;
};

const waitForEndpointHealthy = async ({
  deployments,
  deploymentId,
  logger,
  timeoutSeconds
}: {
  deployments: DeploymentsApi;
  deploymentId: string;
  logger: Logger;
  timeoutSeconds: number;
}): Promise<string | null> => {
  const maxAttempts = Math.max(1, Math.ceil((timeoutSeconds * 1000) / POLL_INTERVAL_MS));
  let endpointUrl: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!endpointUrl) {
      const fresh = await deployments.get(deploymentId);
      endpointUrl = fresh.endpoints?.[0]?.url;
      if (!endpointUrl) {
        await delay(POLL_INTERVAL_MS);
        continue;
      }
      logger.info(`Waiting for endpoint ${endpointUrl}`);
    }

    const url = `${endpointUrl}/api/tags`;
    try {
      const res = await fetch(url, { method: "GET", redirect: "manual" });
      if (res.status === 200) {
        process.stdout.write("\n");
        logger.info("Endpoint healthy");
        return endpointUrl;
      }
    } catch {
      // ignore
    }

    process.stdout.write(".");
    await delay(POLL_INTERVAL_MS);
  }

  logger.error("Endpoint did not become healthy", { deploymentId, url: endpointUrl });
  return null;
};
