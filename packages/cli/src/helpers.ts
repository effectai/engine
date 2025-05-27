import { loadProvider } from "@effectai/utils";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
} from "@solana/kit";

export const loadSolanaContext = async () => {
  const { payer, provider, rpcUrl, websocketUrl } = await loadProvider();

  const rpc = createSolanaRpc(rpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(websocketUrl);

  return {
    rpc,
    rpcSubscriptions,
  };
};
