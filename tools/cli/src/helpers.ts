import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { loadSolanaProviderFromConfig } from "@effectai/solana-utils";
import { connect } from "solana-kite";

export const useConnection = async () => {
  const { rpcUrl, websocketUrl } = await loadSolanaProviderFromConfig();
  const connection = connect(rpcUrl, websocketUrl);

  return { connection };
};

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
