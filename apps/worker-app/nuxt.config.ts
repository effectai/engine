// https://nuxt.com/docs/api/configuration/nuxt-config

import fs from "node:fs";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineNuxtConfig({
  ssr: false,

  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  css: ["@/assets/css/main.css"],
  modules: ["@pinia/nuxt", "@nuxt/ui", "@vueuse/nuxt"],
  app: {
    head: {
      bodyAttrs: {
        class: "bg-white dark:bg-[#333]",
      },
    },
  },
  runtimeConfig: {
    public: {
      ALTERNATIVE_FRONTEND_URL: process.env.ALTERNATIVE_FRONTEND_URL,
      EFFECT_MANAGERS: process.env.EFFECT_MANAGERS?.split(",") ?? [],
      EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
      EFFECT_SOLANA_RPC_NODE_URL: process.env.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT_SOLANA_RPC_WS_URL: process.env.EFFECT_SOLANA_RPC_WS_URL,
      PAYOUT_INTERVAL: process.env.PAYOUT_INTERVAL,
      PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT,
      WEB3_AUTH_CLIENT_ID: process.env.WEB3AUTH_CLIENT_ID,
    },
  },
  vite: {
    plugins: [
      nodePolyfills({
        exclude: ["fs"],
      }),
    ],
    resolve: {
      alias: {
        crypto: "crypto-browserify",
      },
    },
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
      target: "esnext",
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: ["buffer"],
    },
    define: {
      global: "globalThis",
      "process.env.BROWSER": true,
    },
  },
});
