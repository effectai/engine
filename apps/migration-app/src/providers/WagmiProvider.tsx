"use client";

import { type Config, WagmiProvider, cookieToInitialState } from "wagmi";
import { bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import type { ReactNode } from "react";

const projectId = "79d9a7fe570c471146ae1cbc2f6b05cf";

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bsc];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "Effect Migration App",
    description: "An app to migrate your Effect tokens",
    url: "https://migrate.effect.ai",
    icons: [],
  },
});

const queryClient = new QueryClient();

export default function Providers({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies,
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
