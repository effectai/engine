<template>
  <div></div>
</template>
<script setup lang="ts">
import {
	getDefaultExternalAdapters,
	getInjectedAdapters,
} from "@web3auth/default-solana-adapter"; // All default Solana Adapters
import { useWallet, WalletMultiButton } from "solana-wallets-vue";
import { useLocalStorage } from "@vueuse/core";
import { SolanaWalletAdapter } from "@web3auth/torus-solana-adapter";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { AuthAdapter } from "@web3auth/auth-adapter";
import {
	CHAIN_NAMESPACES,
	WEB3AUTH_NETWORK,
	type IAdapter,
	type IProvider,
} from "@web3auth/base";
import { SOLANA_CHAIN_IDS as CHAIN_IDS } from "@web3auth/ws-embed";
import { Web3Auth, type Web3AuthOptions } from "@web3auth/modal";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
const { publicKey, disconnect } = useWallet();
const loggedIn = ref<boolean>(false);

const clientId =
	"BIcF8x3jW7FR6hqAedtD8s0sjsyCsGSRk_sLnuCdDThbaYyk7op5q8J_F3ywacftuWmzHrL39PFZjYocu5vHQMU";

const chainConfig = {
	chainNamespace: CHAIN_NAMESPACES.SOLANA,
	chainId: CHAIN_IDS.SOLANA_MAINNET, // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
	rpcTarget: "https://marni-l6uvpy-fast-mainnet.helius-rpc.com",
	displayName: "Solana Mainnet",
	blockExplorerUrl: "https://explorer.solana.com",
	ticker: "SOL",
	tickerName: "Solana",
	decimals: 9,
	logo: "https://images.toruswallet.io/solana.svg",
};
const privateKeyProvider = new SolanaPrivateKeyProvider({
	config: { chainConfig },
});

const authAdapter = new AuthAdapter({
	privateKeyProvider: privateKeyProvider,
});

const web3AuthOptions: Web3AuthOptions = {
	clientId,
	web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
	privateKeyProvider,
	chainConfig,
};
const web3auth = new Web3Auth(web3AuthOptions);

const privateKey = useLocalStorage("privateKey", null);
onMounted(async () => {
	try {
		await web3auth.initModal();

		if (web3auth.connected && !privateKey.value) {
			await web3auth.logout();
		}

		if (web3auth.connected) {
			loggedIn.value = true;
		} else {
			await web3auth.connect();
			const privateKeyString = await web3auth.provider?.request({
				method: "solanaPrivateKey",
			});

			privateKey.value = privateKeyString;
			loggedIn.value = true;
		}
	} catch (error) {
		console.error(error);
	}
});

watchEffect(() => {
	if (privateKey.value) {
		navigateTo("/");
	}
});

const logout = () => {
	web3auth.logout();
};
</script>
