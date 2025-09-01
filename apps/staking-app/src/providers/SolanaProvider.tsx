"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { EFFECT } from "@/lib/useEffectConfig";

import { connect, type Connection } from "solana-kite";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

type SolanaConnectionContextValue = {
  connection: Connection;
  address: string | null;
  uiAccount: ReturnType<typeof useSolanaWallet>["uiAccount"];
  uiWallet: ReturnType<typeof useSolanaWallet>["uiWallet"];
};

const SolanaContext = createContext<SolanaConnectionContextValue | undefined>(
  undefined,
);

let _conn: ReturnType<typeof connect> | null = null;

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const { address, uiAccount, uiWallet } = useSolanaWallet();

  if (!_conn) {
    _conn = connect(
      EFFECT.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT.EFFECT_SOLANA_RPC_WS_URL,
    );
  }

  const value = useMemo(
    () => ({
      connection: _conn as Connection,
      address,
      uiAccount,
      uiWallet,
    }),
    [address, uiAccount, uiWallet],
  );

  return (
    <SolanaContext.Provider value={value}>{children}</SolanaContext.Provider>
  );
}

export function useSolanaContext() {
  const ctx = useContext(SolanaContext);
  if (!ctx) throw new Error("useCounter must be used within <CounterProvider>");
  return ctx;
}
