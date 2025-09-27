import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["zustand"],
    alias: {
      "@/stores": path.resolve(__dirname, "./src/stores"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
