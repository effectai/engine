import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { connect } from "solana-kite";
import type { SourceChain, SourceWallet, DestWallet } from "@/lib/wallet-types";
import { useEosWallet } from "@/lib/useEosWallet";
import { useBscWallet } from "@/lib/useBscWallet";
import { EFFECT } from "@/lib/useEffectConfig";
import { useWalletContext } from "@effectai/react";

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

  const eos = useEosWallet();
  const bsc = useBscWallet();
  const sol = useWalletContext();

  const source: SourceWallet = useMemo(() => {
    return sourceChain === "EOS" ? eos : bsc;
  }, [sourceChain, eos, bsc]);

  const ready = true;
  const canMigrate = !!source.isConnected && sol.address;

  const connection = connect(
    EFFECT.EFFECT_SOLANA_RPC_NODE_URL,
    EFFECT.EFFECT_SOLANA_RPC_WS_URL,
  );

  const value = useMemo(
    () => ({
      config: EFFECT,
      connection,
      sourceChain,
      setSourceChain,
      source,
      ready,
      canMigrate,
      sol,
    }),
    [sourceChain, connection, source, ready, canMigrate, sol],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMigration() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useMigration must be used within <MigrationProvider>");
  return ctx;
}
