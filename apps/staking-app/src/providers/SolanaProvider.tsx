"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { EFFECT } from "@/lib/useEffectConfig";
import { address as toAddress } from "@solana/kit";

import { connect, type Connection } from "solana-kite";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

export type Balance = { value: number; symbol: string };
type SolanaConnectionContextValue = {
  connection: Connection | null;
  address: string | null;
  uiAccount: ReturnType<typeof useSolanaWallet>["uiAccount"];
  uiWallet: ReturnType<typeof useSolanaWallet>["uiWallet"];
  getEffectBalance: (address: string) => Promise<Balance>;
  getSolBalance: (address: string) => Promise<Balance>;
};

const g = globalThis as any;
if (!g.__kiteConn) g.__kiteConn = { conn: null as Connection | null };

function getOrCreateConnection(): Connection | null {
  if (typeof window === "undefined") return null;
  if (!g.__kiteConn.conn) {
    g.__kiteConn.conn = connect(
      EFFECT.EFFECT_SOLANA_RPC_NODE_URL,
      EFFECT.EFFECT_SOLANA_RPC_WS_URL,
    );
  }
  return g.__kiteConn.conn;
}

const SolanaContext = createContext<SolanaConnectionContextValue | undefined>(
  undefined,
);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { address: walletAddress, uiAccount, uiWallet } = useSolanaWallet();

  const connRef = useRef<Connection | null>(getOrCreateConnection());
  const connection = connRef.current;

  const getEffectBalance = useCallback(
    async (address: string) => {
      if (!connection) return 0;
      const balance = await connection.getTokenAccountBalance({
        wallet: toAddress(address),
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
      });

      return {
        value: balance.uiAmount ?? 0,
        symbol: "EFFECT",
      };
    },
    [connection],
  );

  const getSolBalance = useCallback(
    async (walletAddr: string) => {
      if (!connection) return 0;
      const result = await connection.getLamportBalance(toAddress(walletAddr));
      return {
        value: Number(result) / 1e9 || 0,
        symbol: "SOL",
      };
    },
    [connection],
  );

  const value = useMemo(
    () => ({
      connection,
      address: walletAddress,
      uiAccount,
      uiWallet,
      getEffectBalance,
      getSolBalance,
    }),
    [
      connection,
      walletAddress,
      uiAccount,
      uiWallet,
      getEffectBalance,
      getSolBalance,
    ],
  );

  return (
    <SolanaContext.Provider value={value}>
      <UnifiedWalletButton />
      {walletAddress && children}
    </SolanaContext.Provider>
  );
}

export function useSolanaContext() {
  const ctx = useContext(SolanaContext);
  if (!ctx) throw new Error("useCounter must be used within <CounterProvider>");
  return ctx;
}
