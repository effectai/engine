import { useAnchorWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";

const provider: Ref<anchor.AnchorProvider | null> = ref(null);

export const useAnchorProvider = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  provider.value = new anchor.AnchorProvider(connection, wallet.value, {});

  return {
    provider,
  };
};
