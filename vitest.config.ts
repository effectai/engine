// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    globalSetup: "./packages/test-utils/src/global.ts",
    include: ["packages/**/tests/**/*.test.ts"],
  },
});
