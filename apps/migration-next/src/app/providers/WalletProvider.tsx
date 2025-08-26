"use client";

import {
  UnifiedWalletButton,
  UnifiedWalletProvider,
} from "@jup-ag/wallet-adapter"; // or the exact provider/hook you use
import { ReactNode } from "react";

export default function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <UnifiedWalletProvider
      wallets={[]}
      config={{
        autoConnect: false,
        env: "mainnet-beta",
        metadata: {
          name: "UnifiedWallet",
          description: "UnifiedWallet",
          url: "https://jup.ag",
          iconUrls: ["https://jup.ag/favicon.ico"],
        },
        walletlistExplanation: {
          href: "https://station.jup.ag/docs/old/additional-topics/wallet-list",
        },
      }}
    >
      <UnifiedWalletButton />
    </UnifiedWalletProvider>
  );
}
