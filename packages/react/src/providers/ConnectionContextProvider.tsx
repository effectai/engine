import { createContext, useContext, useMemo } from "react";
import { connect, type Connection } from "solana-kite";
import { useProfileContext } from "./ProfileContextProvider";

type ConnectionContextProviderValue = {
  connection: Connection;
};

const ConnectionContext = createContext<
  ConnectionContextProviderValue | undefined
>(undefined);

export function ConnectionContextProvider({
  children,
}: { children: React.ReactNode }) {
  const { rpcUrl, rpcWsUrl } = useProfileContext();

  const connection = useMemo(
    () => connect(rpcUrl, rpcWsUrl),
    [rpcUrl, rpcWsUrl],
  );

  return (
    <ConnectionContext.Provider
      value={{
        connection,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionContext() {
  const ctx = useContext(ConnectionContext);
  if (!ctx)
    throw new Error(
      "useProfileContext must be used within a ProfileContextProvider",
    );
  return ctx;
}
