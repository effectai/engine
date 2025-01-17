// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  ssr: false,
  css: ["@/assets/css/main.css"],
  modules: [
    "@wagmi/vue/nuxt",
    "@nuxt/ui",
    "@vueuse/nuxt",
    "@vueuse/motion/nuxt",
    "@nuxtjs/device",
  ],
  app: {
    head: {
      bodyAttrs: {
        class: "bg-white dark:bg-[Canvas]",
      },
    },
  },
  runtimeConfig: {
    public: {
      EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
      EFFECT_SNAPSHOT_DATE: process.env.EFFECT_SNAPSHOT_DATE,
      EFFECT_SOLANA_RPC_NODE_URL: process.env.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT:
        process.env.EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT,
    },
  },
  devtools: { enabled: false },
  vite: {
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
