// https://nuxt.com/docs/api/configuration/nuxt-config
import { nodePolyfills } from "vite-plugin-node-polyfills";
//
export default defineNuxtConfig({
	devtools: { enabled: true },
	ssr: false,
	modules: ["@nuxt/ui"],
	plugins: ["~/plugins/wallets.ts"],
	compatibilityDate: "2025-02-17",
	css: ["~/assets/css/main.css"],
	runtimeConfig: {
		public: {
			ALTERNATIVE_FRONTEND_URL: process.env.ALTERNATIVE_FRONTEND_URL,
		},
	},
	vite: {
		plugins: [nodePolyfills()],
	},
});
