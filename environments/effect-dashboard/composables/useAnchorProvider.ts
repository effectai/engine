import { useAnchorWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";

export const useAnchorProvider = () => {   
    const wallet = useAnchorWallet();

    if (!wallet.value) {
		throw new Error("Could not get wallet");
	}

	const provider = new anchor.AnchorProvider(connection, wallet.value, {});

    return {
        provider
    }
}