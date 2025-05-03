import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    treeshake: false,
    dts: true,
    clean: true,
    shims: true,
    format: ["esm"],
    bundle: false,
    entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
    platform: "node",
    target: "esnext",
  },
]);
