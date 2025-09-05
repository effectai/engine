import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      insertTypesEntry: true,
    }),
    // visualizer({
    //   open: true, // auto-open the report
    //   filename: "stats.html", // saved in project root
    //   gzipSize: true,
    //   brotliSize: true,
    //   template: "treemap", // or 'sunburst','network'
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "EffectUI",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
    target: "es2019",
    minify: false, // turn on if you want minified builds
  },
});
