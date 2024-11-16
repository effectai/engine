// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  ssr:false,
  css: ["@/assets/css/main.css"],
  modules: ['@wagmi/vue/nuxt', "@nuxt/ui"],
  runtimeConfig: {
    public: {
      EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
    }
  },
  devtools: { enabled: false },
  vite: {
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true
        }
      },
      target: "esnext",
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: ["@project-serum/anchor", "@solana/web3.js", "buffer"],
      esbuildOptions: {
        target: 'esnext'
      },
    },
    define: {
      "process.env.BROWSER": true,
    },
  }
})