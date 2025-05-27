import { Connection } from "@solana/web3.js";

let connectionInstance: Connection | null = null;

export const useConnection = () => {
  const config = useRuntimeConfig();

  if (!connectionInstance) {
    const rpcUrl = config.public.EFFECT_SOLANA_RPC_NODE_URL;
    connectionInstance = new Connection(rpcUrl, "confirmed");
  }

  return {
    connection: connectionInstance,
  };
};
