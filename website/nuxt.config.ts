import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  ssr: false,
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  build: {
    transpile: ['"@fortawesome/fontawesome-free"'],
  },
  vite: {
    plugins: [tailwindcss()],
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true, // Silences warnings from dependencies like Bulma
          // additionalData: '@use "@/assets/scss/variables.scss";',
        },
      },
    },
  },
  modules: [
    "@nuxt/content",
    "@nuxt/image",
    "@vueuse/motion/nuxt",
    "@nuxt/icon",
  ],
});

