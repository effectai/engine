import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Buffer } from "buffer";

import {
  ProfileContextProvider,
  ConnectionContextProvider,
  UnifiedWalletContextProvider,
  WalletContextProvider,
} from "@effectai/react";

if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
}

import { queryClient } from "@effectai/react";
import { QueryClientProvider } from "@tanstack/react-query";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProfileContextProvider>
        <ConnectionContextProvider>
          <UnifiedWalletContextProvider>
            <WalletContextProvider>
              <App />
            </WalletContextProvider>
          </UnifiedWalletContextProvider>
        </ConnectionContextProvider>
      </ProfileContextProvider>
    </QueryClientProvider>
  </StrictMode>,
);
