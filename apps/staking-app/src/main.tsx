import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Buffer } from "buffer";
import { ProfileContextProvider } from "./providers/ProfileContextProvider.tsx";
import { ConnectionContextProvider } from "./providers/ConnectionContextProvider.tsx";
import { QueryClientContextProvider } from "./providers/QueryClientProvider.tsx";
import {
  UnifiedWalletContextProvider,
  WalletContextProvider,
} from "./providers/WalletContextProvider.tsx";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientContextProvider>
      <ProfileContextProvider>
        <ConnectionContextProvider>
          <UnifiedWalletContextProvider>
            <WalletContextProvider>
              <App />
            </WalletContextProvider>
          </UnifiedWalletContextProvider>
        </ConnectionContextProvider>
      </ProfileContextProvider>
    </QueryClientContextProvider>
  </StrictMode>,
);
