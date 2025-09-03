import { UnifiedWalletProvider, useWallet } from "@jup-ag/wallet-adapter";
import type { Address, Lamports, TransactionSigner } from "@solana/kit";
import { useWalletAccountTransactionSigner } from "@solana/react";
import {
  uiWalletAccountsAreSame,
  useWallets,
  type UiWallet,
  type UiWalletAccount,
} from "@wallet-standard/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useConnectionContext } from "./ConnectionContextProvider";
import {
  useEffectBalance,
  useGetEffectTokenAccount,
  useGetLamports,
} from "@/lib/useQueries";

type WalletContextProviderValue = {
  address: Address | null;
  lamports: Lamports | null | undefined;
  uiAccount: UiWalletAccount | null;
  uiWallet: UiWallet | null;
  signer: TransactionSigner | null;
  userTokenAccount?: Address | null;
  effectBalance?: ReturnType<typeof useEffectBalance>["data"];
};

const WalletContext = createContext<WalletContextProviderValue | undefined>(
  undefined,
);

function useConnectedUiWallet(): {
  uiWallet: UiWallet;
  uiAccount: UiWalletAccount;
} | null {
  const { publicKey } = useWallet();
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

export function isSameSigner(
  a: TransactionSigner | null,
  b: TransactionSigner | null,
) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.address === b.address;
}
export function UnifiedWalletContextProvider({
  children,
}: { children: React.ReactNode }) {
  return (
    <UnifiedWalletProvider
      wallets={[]}
      config={{
        autoConnect: true,
        env: "mainnet-beta",
        metadata: {
          name: "",
          description: "",
          url: "",
          iconUrls: ["https://jup.ag/favicon.ico"],
        },
        walletlistExplanation: {
          href: "https://station.jup.ag/docs/old/additional-topics/wallet-list",
        },
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
}

export function WalletContextProvider({
  children,
}: { children: React.ReactNode }) {
  const { connection } = useConnectionContext();
  const { publicKey } = useWallet();
  const ui = useConnectedUiWallet();

  const address = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const [signer, setSigner] = useState<TransactionSigner | null>(null);

  const setSignerIfChanged = useCallback((next: TransactionSigner | null) => {
    setSigner((prev) => (isSameSigner(prev, next) ? prev : next));
  }, []);

  const { data: userTokenAccount } = useGetEffectTokenAccount(
    connection,
    address,
  );

  const { data: lamports } = useGetLamports(connection, address);

  const { data: availableBalance } = useEffectBalance(
    connection,
    userTokenAccount,
  );

  return (
    <WalletContext.Provider
      value={{
        userTokenAccount: userTokenAccount,
        effectBalance: availableBalance,
        lamports,
        address: address as Address | null,
        uiAccount: ui ? ui.uiAccount : null,
        uiWallet: ui ? ui.uiWallet : null,
        signer,
      }}
    >
      {ui ? (
        <SignerBridge
          uiAccount={ui.uiAccount}
          onChange={setSignerIfChanged}
          chain={"solana:mainnet"}
        />
      ) : (
        signer !== null && <ResetSigner onChange={setSignerIfChanged} />
      )}
      {children}
    </WalletContext.Provider>
  );
}

const SignerBridge = React.memo(function SignerBridge({
  uiAccount,
  chain,
  onChange,
}: {
  uiAccount: UiWalletAccount;
  chain: `solana:${string}`;
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

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx)
    throw new Error(
      "useProfileContext must be used within a ProfileContextProvider",
    );
  return ctx;
}
