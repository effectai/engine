import { connect } from "solana-kite";

let connectionInstance: ReturnType<typeof connect> | null = null;

export const useConnection = () => {
  const config = useRuntimeConfig();

  if (!connectionInstance) {
    const rpcUrl = config.public.EFFECT_SOLANA_RPC_NODE_URL;
    const wsRpcUrl = config.public.EFFECT_SOLANA_RPC_WS_URL;
    connectionInstance = connect(rpcUrl, wsRpcUrl);
  }

  return {
    connection: connectionInstance,
  };
};
