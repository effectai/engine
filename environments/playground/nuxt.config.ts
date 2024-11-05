import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: ''
  },
  css: [
    '@/assets/css/main.css'
  ],
  ssr:false,
  runtimeConfig: {
    public: {
      BOOTSTRAP_NODE: process.env.BOOTSTRAP_NODE || [],
    }
  },
  vite: {
    plugins: [
      nodePolyfills()
    ]
  },

  modules: ["@nuxt/ui"]
})