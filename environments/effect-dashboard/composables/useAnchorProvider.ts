import { useAnchorWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";


export const useAnchorProvider = () => {   
    const wallet = useAnchorWallet();

	const provider = new anchor.AnchorProvider(connection, wallet.value, {});

    return {
        provider
    }
}