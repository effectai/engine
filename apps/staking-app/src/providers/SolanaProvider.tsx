"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EFFECT } from "@/lib/useEffectConfig";
import {
  address as toAddress,
  type Address,
  type TransactionSigner,
} from "@solana/kit";

import { connect, type Connection } from "solana-kite";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import { useWalletAccountTransactionSigner } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";

export type Balance = { value: number; symbol: string };

type SolanaConnectionContextValue = {
  connection: Connection | null;
  address: string | null;
  signer: TransactionSigner | null;
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

function isSameSigner(
  a: TransactionSigner | null,
  b: TransactionSigner | null,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  // Compare stable fields; prefer account address or publicKey bytes
  // @ts-expect-error shape depends on your lib
  const aKey = a.address ?? a.publicKey?.toString?.() ?? a.account?.address;
  // @ts-expect-error
  const bKey = b.address ?? b.publicKey?.toString?.() ?? b.account?.address;
  return aKey === bKey;
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { address: walletAddress, uiAccount, uiWallet } = useSolanaWallet();

  const connRef = useRef<Connection | null>(getOrCreateConnection());
  const connection = connRef.current;

  const [signer, setSigner] = useState<TransactionSigner | null>(null);

  const setSignerIfChanged = useCallback((next: TransactionSigner | null) => {
    setSigner((prev) => (isSameSigner(prev, next) ? prev : next));
  }, []);

  const getEffectBalance = useCallback(
    async (address: string) => {
      if (!connection) return { value: 0, symbol: "EFFECT" as const };
      const balance = await connection.getTokenAccountBalance({
        wallet: toAddress(address),
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
      });
      return { value: balance.uiAmount ?? 0, symbol: "EFFECT" as const };
    },
    [connection],
  );

  const getSolBalance = useCallback(
    async (walletAddr: string) => {
      if (!connection) return { value: 0, symbol: "SOL" as const };
      const lamports = await connection.getLamportBalance(
        toAddress(walletAddr),
      );
      return { value: Number(lamports) / 1e9 || 0, symbol: "SOL" as const };
    },
    [connection],
  );

  const value = useMemo(
    () => ({
      connection,
      address: walletAddress,
      uiAccount,
      uiWallet,
      signer,
      getEffectBalance,
      getSolBalance,
    }),
    [
      connection,
      walletAddress,
      uiAccount,
      uiWallet,
      signer,
      getEffectBalance,
      getSolBalance,
    ],
  );

  const chain = "solana:mainnet"; // or import.meta.env.VITE_SOLANA_CHAIN_ID

  return (
    <SolanaContext.Provider value={value}>
      {uiAccount ? (
        <SignerBridge
          uiAccount={uiAccount}
          onChange={setSignerIfChanged}
          chain={chain}
        />
      ) : (
        signer !== null && <ResetSigner onChange={setSignerIfChanged} />
      )}
      <UnifiedWalletButton />
      {walletAddress && children}
    </SolanaContext.Provider>
  );
}

const SignerBridge = React.memo(function SignerBridge({
  uiAccount,
  chain,
  onChange,
}: {
  uiAccount: UiWalletAccount;
  chain: string;
  onChange: (s: TransactionSigner | null) => void;
}) {
  const signer = useWalletAccountTransactionSigner(uiAccount, chain);
  useEffect(() => {
    onChange(signer ?? null);
  }, [signer, onChange]);
  return null;
});
function ResetSigner({
  onChange,
}: { onChange: (s: TransactionSigner | null) => void }) {
  useEffect(() => {
    onChange(null);
  }, [onChange]);
  return null;
}

export function useSolanaContext() {
  const ctx = useContext(SolanaContext);
  if (!ctx)
    throw new Error("useSolanaContext must be used within <SolanaProvider>");
  return ctx;
}
