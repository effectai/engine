import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { loadSolanaProviderFromConfig } from "@effectai/solana-utils";

export const loadSolanaContext = async () => {
  const { rpcUrl, websocketUrl, signer } = await loadSolanaProviderFromConfig();

  const rpc = createSolanaRpc(rpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(websocketUrl);

  return {
    signer,
    rpc,
    rpcSubscriptions,
  };
};
