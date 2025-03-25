import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "solana-wallets-vue";

// const config = useRuntimeConfig();
// const rpcUrl = config.public.EFFECT_SOLANA_RPC_NODE_URL;

export const connection: Ref<Connection | null> = ref(null);
export const publicKeyString = ref<string | null>(null);

export const useGlobalState = () => {
	const config = useRuntimeConfig();

	connection.value = new Connection(config.public.EFFECT_SOLANA_RPC_NODE_URL);

	if (!config.public.EFFECT_SOLANA_RPC_NODE_URL) {
		throw new Error(
			"EFFECT_SOLANA_RPC_NODE_URL not set. Please set it in your .env file",
		);
	}

	if (!config.public.EFFECT_SPL_TOKEN_MINT) {
		throw new Error(
			"EFFECT_SPL_TOKEN_MINT not set. Please set it in your .env file",
		);
	}

	const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);

	return {
		connection,
		mint,
	};
};
