import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import WagmiProvider from "./providers/WagmiProvider";
import WalletProvider from "./providers/SolanaProvider";
import { MigrationProvider } from "./providers/MigrationProvider";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <WagmiProvider>
        <MigrationProvider>
          <App />
        </MigrationProvider>
      </WagmiProvider>
    </WalletProvider>
  </StrictMode>,
);
