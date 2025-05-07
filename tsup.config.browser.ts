import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    treeshake: true,
    clean: false,
    dts: true,
    format: ["esm", "cjs"],
    entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
    platform: "browser",
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".browser.mjs" : ".browser.cjs",
      };
    },
  },
]);
