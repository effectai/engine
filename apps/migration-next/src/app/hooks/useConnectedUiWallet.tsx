import { useWallet } from "@jup-ag/wallet-adapter"; // from Jupiter's provider
import { type UiWallet, useWallets } from "@wallet-standard/react";
import { useMemo } from "react";

export function useConnectedUiWallet(): UiWallet | null {
  const { publicKey } = useWallet(); // Jupiter-selected wallet's pubkey
  const wallets = useWallets();
  const address = publicKey?.toBase58();

  return useMemo(() => {
    if (!address) return null;
    // Find the UiWallet whose accounts include the connected address
    for (const w of wallets) {
      if (w.accounts.some((a) => a.address === address)) return w;
    }
    return null;
  }, [wallets, address]);
}
