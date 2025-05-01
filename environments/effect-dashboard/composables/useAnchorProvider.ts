import { useAnchorWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import { SolanaWallet } from "@web3auth/solana-provider";

const provider: Ref<anchor.AnchorProvider | null> = ref(null);

export const useAnchorProvider = () => {
  const wallet = useAnchorWallet();

  provider.value = new anchor.AnchorProvider(connection, wallet.value, {});

  return {
    provider,
  };
};
