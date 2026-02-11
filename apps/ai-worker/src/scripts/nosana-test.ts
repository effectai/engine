import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { state } from "../state.js";
import { createConsoleLogger } from "../logger.js";
import { createNosanaBackend } from "../backend/nosana.js";

const keyPath = fileURLToPath(
  new URL("../../tst8sA9paoprGP987QKSuX9VoHY22AXtB8b3bMTckf4.json", import.meta.url),
);
const secret = Uint8Array.from(JSON.parse(readFileSync(keyPath, "utf-8")) as number[]);

state.logger = createConsoleLogger("nosana-test");
state.privateKey = { raw: secret } as any;

try {
  const backend = await createNosanaBackend();
  await backend.init();
  console.log("Nosana backend initialized");
} catch (err: unknown) {
  console.error("nosana-backend error", err);
  process.exitCode = 1;
}
