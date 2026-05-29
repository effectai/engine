import { Address, createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { loadSolanaProviderFromConfig } from "@effectai/solana-utils";
import { connect } from "solana-kite";

export const TOKEN_MINT = "EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E" as Address;

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
