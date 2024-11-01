// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  css: ['~/assets/scss/global.scss','@/assets/scss/variables.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,  // Silences warnings from dependencies like Bulma
          // additionalData: '@use "@/assets/scss/variables.scss";',
        },
      },
    },
  },
});
