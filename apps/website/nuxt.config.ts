import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2025-08-13",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  modules: ["@nuxt/icon", "@nuxt/content", "@nuxt/image"],
  content: {
    build: {
      markdown: {
        highlight: {
          theme: "github-dark",
          langs: ["js", "json", "ts", "css", "html", "bash", "md", "yaml", "vue", "csv"],
        },
      },
    },
  },
});
