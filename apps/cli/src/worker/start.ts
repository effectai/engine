import { Command } from "commander";
import { LevelDatastore } from "datastore-level";
import { readFileSync } from "node:fs";
import { generateKeyPairFromSeed } from "@effectai/protocol";
import { createNosanaBackend } from "./backend/nosana.js";
import { startWorker, stopWorker } from "./runtime.js";
import { state } from "./state.js";
import { createConsoleLogger } from "./logger.js";

const DEFAULT_MANAGER =
  "/ip4/127.0.0.1/tcp/11995/ws/p2p/12D3KooWAQH4SQHt12N2eGnAUR4iixS8TAfKxRqfd17sDurZ1v5R";
const collect = (val: string, prev: string[]) => [...prev, val];

const DEFAULT_CAPABILITY = "effectai/is-ai";
const DEFAULT_DATA_PATH = "/tmp/ai-worker";
const DEFAULT_NOSANA_API = "https://dashboard.k8s.prd.nos.ci";
const DEFAULT_MARKET = "6Xt8hgVLLL2PSHC9NtJP8E8oTdA5ZJc95hZEnHcdqKqb";
const DEFAULT_MODEL = "gpt-oss:20b";
const DEFAULT_IMAGE = "docker.io/ollama/ollama:0.20.0";
const DEFAULT_DEPLOYMENT_NAME = "effectai-ai-worker";
const DEFAULT_ENDPOINT_TIMEOUT_SECONDS = 300;

const parseInteger = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Expected integer, got ${value}`);
  }
  return parsed;
};

const loadSecretKey = (keypairPath: string): Uint8Array => {
  const privateKey = readFileSync(keypairPath, "utf-8");
  const parsed = JSON.parse(privateKey);
  if (!Array.isArray(parsed)) {
    throw new Error(`Keypair file must contain a JSON array: ${keypairPath}`);
  }
  return Uint8Array.from(parsed as number[]);
};

export const startCommand = new Command();

startCommand.name("start").description("Start a worker node");

startCommand
  .command("nosana")
  .description("Start a Nosana-backed worker")
  .option("--manager <multiaddr>", "Manager libp2p multiaddr", DEFAULT_MANAGER)
  .option("--data <path>", "Path to worker datastore", DEFAULT_DATA_PATH)
  .option(
    "--capability <value>", "Capability identifier to advertise (repeatable)",
    collect,
    [DEFAULT_CAPABILITY]
  )
  .option("--access-code <code>", "Manager access code")
  .option("--nosana-api <url>", "Nosana API backend URL", DEFAULT_NOSANA_API)
  .option("--market <address>", "Nosana market address", DEFAULT_MARKET)
  .option("--model <name>", "Ollama model name", DEFAULT_MODEL)
  .option("--image <image>", "Nosana container image", DEFAULT_IMAGE)
  .option("--deployment-name <name>", "Nosana deployment name", DEFAULT_DEPLOYMENT_NAME)
  .option("--replicas <number>", "Nosana deployment replica count", parseInteger, 1)
  .option("--timeout <minutes>", "Nosana deployment timeout in minutes", parseInteger, 60)
  .option(
    "--endpoint-timeout <seconds>",
    "Seconds to wait for the Nosana endpoint to become healthy",
    parseInteger,
    DEFAULT_ENDPOINT_TIMEOUT_SECONDS
  )
  .option(
    "--clear-deployments",
    "Stop existing running Nosana deployments and exit without creating a new one",
    false
  )
  .option("--list-deployments", "List running Nosana deployments and exit", false)
  .action(async (options, cmd) => {
    const opts = cmd.optsWithGlobals();

    if (!opts.keypair) {
      console.error("Error: missing required global option -k, --keypair <path>");
      process.exit(1);
    }

    let shuttingDown = false;

    if (opts.verbose) {
      state.logger = createConsoleLogger("worker", "debug");
    }

    process.on("SIGINT", () => {
      if (shuttingDown) {
        process.exit(0);
      }
      shuttingDown = true;
      state.logger.info("Shutting down...");
      state.done = true;
      state.backend?.cleanup?.()?.catch(() => {});
    });
    process.on("SIGTERM", () => {
      if (shuttingDown) return;
      shuttingDown = true;
      state.logger.info("Shutting down...");
      state.done = true;
      state.backend?.cleanup?.()?.catch(() => {});
    });

    try {
      const secretKey = loadSecretKey(opts.keypair);
      state.solanaSecretKey = secretKey;
      state.privateKey = await generateKeyPairFromSeed(
        "Ed25519",
        secretKey.slice(0, 32),
      );
      state.datastore = new LevelDatastore(options.data);
      await (state.datastore as LevelDatastore).open();

      state.backend = await createNosanaBackend({
        apiBackendUrl: options.nosanaApi,
        market: options.market,
        model: options.model,
        image: options.image,
        deploymentName: options.deploymentName,
        replicas: options.replicas,
        timeoutMinutes: options.timeout,
        endpointTimeoutSeconds: options.endpointTimeout,
        clearDeployments: options.clearDeployments,
        listDeploymentsOnly: options.listDeployments,
      });

      if (options.clearDeployments || options.listDeployments) {
        await state.backend.init();
        return;
      }

      await startWorker({
        manager: options.manager,
        capability: options.capability,
        accessCode: options.accessCode,
      });
    } catch (e) {
      console.error("Error:", e instanceof Error ? e.message : e);
      process.exitCode = 1;
    } finally {
      await stopWorker();
      await (state.datastore as LevelDatastore | undefined)?.close();
    }
  });
