// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  ssr:false,
  css: ["@/assets/css/main.css"],
  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '-mode',
    storage: 'localStorage', // or 'sessionStorage' or 'cookie'
    storageKey: 'nuxt-color-mode'
  },
  modules: ['@wagmi/vue/nuxt', "@nuxt/ui", "@vueuse/nuxt"],
  runtimeConfig: {
    public: {
      EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
      EFFECT_VAULT_INITIALIZER: process.env.EFFECT_VAULT_INITIALIZER,
    }
  },
  devtools: { enabled: false },
  vite: {
    resolve: {
      alias: {
        // 'eventemitter3': 'eventemitter3/browser',
      }
    },
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
      include: ["@project-serum/anchor", "@solana/web3.js", "buffer", '@wagmi/vue', 'eventemitter3'],
      esbuildOptions: {
        target: 'esnext'
      },
    },
    define: {
      "process.env.BROWSER": true,
    },
  }
})