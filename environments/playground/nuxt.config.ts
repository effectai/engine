// https://nuxt.com/docs/api/configuration/nuxt-config
import { nodePolyfills } from "vite-plugin-node-polyfills";
//
export default defineNuxtConfig({
	devtools: { enabled: false },
	ssr: false,
	modules: ["@nuxt/ui", "@vueuse/nuxt"],
	plugins: ["~/plugins/wallets.ts"],
	compatibilityDate: "2024-11-01",
	css: ["~/assets/css/main.css"],
	runtimeConfig: {
		public: {
			PAYOUT_INTERVAL: process.env.PAYOUT_INTERVAL,
			MANAGER_MULTI_ADDRESS: process.env.MANAGER_MULTI_ADDRESS,
			EFFECT_SPL_TOKEN_MINT: process.env.EFFECT_SPL_TOKEN_MINT,
			EFFECT_SOLANA_RPC_NODE_URL: process.env.EFFECT_SOLANA_RPC_NODE_URL,
			ALTERNATIVE_FRONTEND_URL: process.env.ALTERNATIVE_FRONTEND_URL,
		},
	},
	vite: {
		plugins: [nodePolyfills()],
	},
});
