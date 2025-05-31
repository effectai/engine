import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

export const useSolanaRpc = () => {
  const config = useRuntimeConfig();
  const rpcUrl = config.public.EFFECT_SOLANA_RPC_NODE_URL;
  const rpcWsUrl = config.public.EFFECT_SOLANA_RPC_WS_URL;

  const rpc = createSolanaRpc(rpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(rpcWsUrl);

  return { rpc, rpcSubscriptions };
};
