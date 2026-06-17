import { loadWorkerConfig } from "../config.js";
import { state } from "../state.js";
import { createConsoleLogger } from "../logger.js";
import { createNosanaBackend, runNosanaInference } from "../backend/nosana.js";

const { privateKey } = loadWorkerConfig();

state.logger = createConsoleLogger("nosana-test");
state.privateKey = { raw: privateKey } as any;

try {
  const backend = await createNosanaBackend();
  await backend.init();
  console.log("Nosana backend initialized");

  const endpointUrl = state.deploymentEndpointUrl;
  if (!endpointUrl) {
    console.error("Inference skipped: no endpoint URL available after init");
  } else {
    const response = await runNosanaInference({
      logger: state.logger,
      endpointUrl,
      context: "nosana-test",
      prompt: "Hello how are you doing?",
    });
    console.log("Inference response:");
    console.log(response);
  }
} catch (err: unknown) {
  console.error("nosana-backend error", err);
  process.exitCode = 1;
}
