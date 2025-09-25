import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SourceChain, SourceWallet } from "@/lib/wallet-types";
import { useEosWallet } from "@/lib/useEosWallet";
import { useBscWallet } from "@/lib/useBscWallet";

type MigrationContextValue = {
  sourceChain: SourceChain | null; // EOS or BSC (selected)
  setSourceChain: (c: SourceChain | null) => void;
  sourceWallet: SourceWallet; // EOS or BSC (selected)
  ready: boolean; // both providers mounted
};

const Ctx = createContext<MigrationContextValue | null>(null);
const STORAGE_KEY = "effect:selected-source-chain";

export function MigrationProvider({ children }: { children: React.ReactNode }) {
  const [sourceChain, setSourceChainState] = useState<SourceChain | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "EOS" || saved === "BSC") setSourceChainState(saved);
  }, []);

  const setSourceChain = (c: SourceChain | null) => {
    setSourceChainState(c);
    try {
      if (c === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  const eos = useEosWallet();
  const bsc = useBscWallet();

  const source: SourceWallet = useMemo(() => {
    return sourceChain === "EOS" ? eos : bsc;
  }, [sourceChain, eos, bsc]);

  const ready = true;

  const value = useMemo(
    () => ({
      sourceChain,
      setSourceChain,
      sourceWallet: source,
      ready,
    }),
    [sourceChain, source, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMigration() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useMigration must be used within <MigrationProvider>");
  return ctx;
}
