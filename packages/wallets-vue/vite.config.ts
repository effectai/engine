import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

const external = [
  /^vue($|\/)/,

  // Nuxt + kit
  /^nuxt($|\/)/,
  /^@nuxt\/kit($|\/)/,

  // Nuxt virtual imports (only exist in a Nuxt app build)
  /^#app$/,
  /^#imports$/,

  // Your peers (leave unbundled)
  /^@solana\/kit($|\/)/,
  /^@wallet-standard\/base($|\/)/,
  /^@solana\/wallet-standard-features($|\/)/,
  /^@solana\/web3\.js($|\/)/,
];

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue(),
    dts({
      entryRoot: "src",
      outDir: "dist",
      tsconfigPath: path.resolve(__dirname, "tsconfig.json"),
      copyDtsFiles: true,
      include: ["src", "nuxt-config.d.ts"],
      exclude: ["**/*.spec.*", "**/*.test.*", "dist", "dev", "playground"],
    }),
  ],

  build: {
    target: "esnext",
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "@effectai/wallets-vue",
      formats: ["es"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external,
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
    minify: false,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  },
});
