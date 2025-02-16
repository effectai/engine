// https://nuxt.com/docs/api/configuration/nuxt-config
import { nodePolyfills } from "vite-plugin-node-polyfills";
//
export default defineNuxtConfig({
	devtools: { enabled: true },
	ssr: false,
	modules: ["@nuxt/ui"],
	compatibilityDate: "2025-02-16",
	vite: {
		plugins: [nodePolyfills()],
	},
});
