// https://nuxt.com/docs/api/configuration/nuxt-config
import { nodePolyfills } from "vite-plugin-node-polyfills";
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  ssr: false,
  css: ["@/assets/css/main.css"],
  modules: [
    "@pinia/nuxt",
    "@wagmi/vue/nuxt",
    "@nuxt/ui",
    "@vueuse/nuxt",
    "@vueuse/motion/nuxt",
    "@nuxtjs/device",
  ],
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
      EFFECT_SNAPSHOT_DATE: process.env.EFFECT_SNAPSHOT_DATE,
      EFFECT_SOLANA_RPC_NODE_URL: process.env.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT_SOLANA_RPC_WS_URL: process.env.EFFECT_SOLANA_RPC_WS_URL,
      PAYOUT_INTERVAL: process.env.PAYOUT_INTERVAL,
      PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT,
      EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT:
        process.env.EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT,
      WEB3_AUTH_CLIENT_ID: process.env.WEB3AUTH_CLIENT_ID,
    },
  },
  devtools: { enabled: false },
  vite: {
    plugins: [
      nodePolyfills({
        exclude: ["fs"],
      }),
    ],
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
      exclude: ["@effectai/utils"],
      include: ["@solana/web3.js", "@wagmi/vue", "eventemitter3"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    define: {
      "process.env.BROWSER": true,
    },
  },
});
