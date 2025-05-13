import { vitePlugin as remix } from "@remix-run/dev";
import path from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { watchAndRun } from "vite-plugin-watch-and-run";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  resolve: {
    alias: {
      // "@": path.resolve(__dirname, "./app"),
    },
  },
  plugins: [
    watchAndRun([
      {
        name: "gen",
        watch: path.resolve("app/**/*.(tsx)"),
        run: "pnpm build",
        // watchKind: ['add', 'change', 'unlink'], // (default)
        delay: 300, // (default)
      },
    ]),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
});
