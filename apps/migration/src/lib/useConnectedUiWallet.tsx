"use client";

import { useMemo } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import {
  type UiWallet,
  type UiWalletAccount,
  useWallets,
  uiWalletAccountsAreSame,
} from "@wallet-standard/react";

export function useConnectedUiWallet(): {
  uiWallet: UiWallet;
  uiAccount: UiWalletAccount;
} | null {
  const { publicKey } = useWallet(); // Jupiter-selected wallet
  const wallets = useWallets();

  return useMemo(() => {
    if (!publicKey) return null;
    const selectedAddr = publicKey.toBase58();

    for (const w of wallets) {
      for (const a of w.accounts) {
        if (
          a.address === selectedAddr ||
          uiWalletAccountsAreSame(a, { address: selectedAddr } as any)
        ) {
          return { uiWallet: w, uiAccount: a };
        }
      }
    }
    return null;
  }, [wallets, publicKey]);
}
