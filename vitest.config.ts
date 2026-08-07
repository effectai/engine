import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@effectai/test-utils": fileURLToPath(
        new URL("./packages/test-utils/src/index.ts", import.meta.url),
      ),
      "@capabilities": fileURLToPath(
        new URL("./apps/worker-app/app/constants/capabilities.ts", import.meta.url),
      ),
    },
  },
  test: {
    root: rootDir,
  },
});
