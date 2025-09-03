import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query/queryClient";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { SolanaProvider } from "./SolanaProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
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
        <SolanaProvider>{children}</SolanaProvider>
      </UnifiedWalletProvider>
    </QueryClientProvider>
  );
}
