import SolanaWallets from "solana-wallets-vue";
import "solana-wallets-vue/styles.css";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { initWallet } from "solana-wallets-vue";

const walletOptions = {
	wallets: [new PhantomWalletAdapter()],
	autoConnect: true,
};

export default defineNuxtPlugin((nuxtApp) => {
	console.log("wallets.ts");
	nuxtApp.vueApp.use(SolanaWallets, walletOptions);
});
