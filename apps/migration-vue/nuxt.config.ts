// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  modules: ["@effectai/wallets-vue"],
  devtools: { enabled: true },
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: {
    public: {
      EFFECT_SOLANA_RPC_NODE_URL: process.env.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT_SOLANA_RPC_WS_URL: process.env.EFFECT_SOLANA_RPC_WS_URL,
      EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
    },
  },
});
