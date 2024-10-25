import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  vite: {
    plugins: [nodePolyfills()]
  },
  runtimeConfig: {
    public: {
      ALTERNATIVE_FRONTEND_URL: process.env.ALTERNATIVE_FRONTEND_URL
    }
  }
})
