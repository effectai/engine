"use client";

import type { DestWallet } from "@/lib/wallet-types";
import { useCallback, useMemo } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { useConnectedUiWallet } from "./useConnectedUiWallet";

export function useSolanaWallet(): DestWallet & {
  uiWalletEntry: ReturnType<typeof useConnectedUiWallet>;
} {
  const {
    publicKey,
    connected,
    connect,
    disconnect,
    sendTransaction,
    signTransaction,
    signAllTransactions,
    signMessage,
    wallet, // underlying adapter if you need it
  } = useWallet();

  const address = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);
  const uiWalletEntry = useConnectedUiWallet();

  // optional helpers you might want downstream:
  const signMsg = useCallback(
    async (msg: Uint8Array | string) => {
      if (!signMessage) throw new Error("Wallet does not support signMessage");
      const bytes =
        typeof msg === "string" ? new TextEncoder().encode(msg) : msg;
      return await signMessage(bytes);
    },
    [signMessage],
  );

  return {
    address,
    isConnected: !!connected,
    connect: async () => {
      await connect();
    },
    disconnect: async () => {
      await disconnect();
    },

    // expose any Solana helpers you’ll need later
    // (add them to DestWallet if you want them typed there)
    // e.g., you could export sendTransaction/signTransaction via a wrapper
    // sendTransaction, signTransaction, signAllTransactions, signMessage: signMsg,

    // extra for convenience
    uiWalletEntry,
  } as DestWallet & { uiWalletEntry: NonNullable<typeof uiWalletEntry> | null };
}
