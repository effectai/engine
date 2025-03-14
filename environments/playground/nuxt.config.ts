// https://nuxt.com/docs/api/configuration/nuxt-config
import { nodePolyfills } from "vite-plugin-node-polyfills";
//
export default defineNuxtConfig({
	devtools: { enabled: true },
	ssr: false,
	modules: ["@nuxt/ui", "@vueuse/nuxt"],
	plugins: ["~/plugins/wallets.ts"],
	compatibilityDate: "2024-11-01",
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

