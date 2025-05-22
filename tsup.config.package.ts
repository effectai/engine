import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    dts: true,
    clean: true,
    shims: true,
    format: ["esm", "cjs"],
    entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
    platform: "node",
  },
]);
