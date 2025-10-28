import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Buffer } from "buffer";
import { install } from "@solana/webcrypto-ed25519-polyfill";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
}

import WagmiProvider from "./providers/WagmiProvider";
import { MigrationProvider } from "./providers/MigrationProvider";
import App from "./App";

import {
  ProfileContextProvider,
  ConnectionContextProvider,
  UnifiedWalletContextProvider,
  WalletContextProvider,
} from "@effectai/react";

const profile = import.meta.env.VITE_EFFECT_PROFILE || "mainnet";

install();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProfileContextProvider profile={profile}>
      <ConnectionContextProvider>
        <UnifiedWalletContextProvider>
          <WalletContextProvider>
            <WagmiProvider cookies={null}>
              <MigrationProvider>
                <App />
              </MigrationProvider>
            </WagmiProvider>
          </WalletContextProvider>
        </UnifiedWalletContextProvider>
      </ConnectionContextProvider>
    </ProfileContextProvider>
  </StrictMode>,
);
