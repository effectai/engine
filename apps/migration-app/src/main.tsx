import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import WagmiProvider from "./providers/WagmiProvider";
import { MigrationProvider } from "./providers/MigrationProvider";
import App from "./App";

import {
  ProfileContextProvider,
  ConnectionContextProvider,
  UnifiedWalletContextProvider,
  WalletContextProvider,
} from "@effectai/react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProfileContextProvider>
      <ConnectionContextProvider>
        <UnifiedWalletContextProvider>
          <WalletContextProvider>
            <WagmiProvider>
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
