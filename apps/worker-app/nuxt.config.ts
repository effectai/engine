export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-03-01",
  devtools: { enabled: true },
  css: ["@/assets/css/main.css"],
  ui: {
    colorMode: false,
  },
  modules: ["@pinia/nuxt", "@nuxt/ui", "@vueuse/nuxt"],

  runtimeConfig: {
    public: {
      ALTERNATIVE_FRONTEND_URL: process.env.ALTERNATIVE_FRONTEND_URL,
      EFFECT_MANAGERS: process.env.EFFECT_MANAGERS?.split(",") ?? [],
      EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
      EFFECT_SOLANA_RPC_NODE_URL: process.env.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT_SOLANA_RPC_WS_URL: process.env.EFFECT_SOLANA_RPC_WS_URL,
      PAYOUT_INTERVAL: process.env.PAYOUT_INTERVAL,
      PAYMENT_ACCOUNT: process.env.PAYMENT_ACCOUNT,
      TASK_POSTER_URL: process.env.TASK_POSTER_URL,
      WEB3_AUTH_CLIENT_ID: process.env.WEB3AUTH_CLIENT_ID,
    },
  },
  experimental: {
    clientNodeCompat: true,
  },
  vite: {
    esbuild: {
      target: "esnext",
    },
    build: {
      target: "esnext",
      sourcemap: true,
      minify: false,
    },
  },
});
