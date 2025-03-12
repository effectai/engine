<template>
  <div>
    <WalletMultiButton class="mt-5" />
  </div>
</template>
<script setup lang="ts">
import { useWallet, WalletMultiButton } from "solana-wallets-vue";
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";
import { AuthAdapter } from "@web3auth/auth-adapter";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3Auth, type Web3AuthOptions } from "@web3auth/modal";
const { publicKey, disconnect } = useWallet();

const clientId =
	"BIcF8x3jW7FR6hqAedtD8s0sjsyCsGSRk_sLnuCdDThbaYyk7op5q8J_F3ywacftuWmzHrL39PFZjYocu5vHQMU";

const chainConfig = {
	chainNamespace: CHAIN_NAMESPACES.SOLANA,
	chainId: "0x1", // Please use 0x1 for Mainnet, 0x2 for Testnet, 0x3 for Devnet
	rpcTarget: "https://rpc.ankr.com/solana",
	displayName: "Solana Mainnet",
	blockExplorerUrl: "https://explorer.solana.com",
	ticker: "SOL",
	tickerName: "Solana",
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
	web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
	privateKeyProvider,
};
const web3auth = new Web3Auth(web3AuthOptions);
web3auth.configureAdapter(authAdapter);

watchEffect(() => {
	if (publicKey.value) {
		//redirect to home
		navigateTo("/");
	}
});
</script>
