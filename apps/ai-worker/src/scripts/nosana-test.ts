import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadWorkerConfig } from "../config.js";
import { state } from "../state.js";
import { createConsoleLogger } from "../logger.js";
import { createNosanaBackend } from "../backend/nosana.js";

const { privateKey } = loadWorkerConfig();

state.logger = createConsoleLogger("nosana-test");
state.privateKey = { raw: privateKey } as any;

try {
  const backend = await createNosanaBackend();
  await backend.init();
  console.log("Nosana backend initialized");
} catch (err: unknown) {
  console.error("nosana-backend error", err);
  process.exitCode = 1;
}
