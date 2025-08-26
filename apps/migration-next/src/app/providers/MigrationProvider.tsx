"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SourceChain, SourceWallet, DestWallet } from "@/lib/wallet-types";
import { useEosWallet } from "@/lib/useEosWallet";
import { useBscWallet } from "@/lib/useBscWallet";
import { useSolanaWallet } from "@/lib/useSolanaWallet"; // your Solana hook
import { WagmiProvider } from "wagmi";

type MigrationContextValue = {
  sourceChain: SourceChain;
  setSourceChain: (c: SourceChain) => void;

  source: SourceWallet; // EOS or BSC (selected)
  dest: DestWallet; // Solana

  ready: boolean; // both providers mounted
  canMigrate: boolean; // both wallets connected
};

const Ctx = createContext<MigrationContextValue | null>(null);
const STORAGE_KEY = "effect:selected-source-chain";

export function MigrationProvider({ children }: { children: React.ReactNode }) {
  const [sourceChain, setSourceChainState] = useState<SourceChain>("EOS");
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "EOS" || saved === "BSC") setSourceChainState(saved);
  }, []);
  const setSourceChain = (c: SourceChain) => {
    setSourceChainState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  // Instantiate all hooks unconditionally
  const eos = useEosWallet();
  const bsc = useBscWallet();
  const sol = useSolanaWallet();

  // Pick the active source wallet
  const source: SourceWallet = useMemo(() => {
    return sourceChain === "EOS" ? eos : bsc;
  }, [sourceChain, eos, bsc]);

  const dest: DestWallet = sol;

  const ready = true; // hooks mounted
  const canMigrate = !!source.isConnected && !!dest.isConnected;

  const value = useMemo(
    () => ({ sourceChain, setSourceChain, source, dest, ready, canMigrate }),
    [sourceChain, source, dest, ready, canMigrate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMigration() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useMigration must be used within <MigrationProvider>");
  return ctx;
}
