import { getAssociatedTokenAccount } from "@effectai/solana-utils";
import {
  address,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";
import { useQuery } from "@tanstack/vue-query";

export const useSolanaRpc = () => {
  const config = useRuntimeConfig();
  const rpcUrl = config.public.EFFECT_SOLANA_RPC_NODE_URL;
  const rpcWsUrl = config.public.EFFECT_SOLANA_RPC_WS_URL;

  const rpc = createSolanaRpc(rpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(rpcWsUrl);

  const useGetEffectBalanceQuery = (
    account: Ref<string | null | undefined>,
  ) => {
    const { mint } = useEffectConfig();

    return useQuery({
      queryKey: ["effect-balance", account],
      enabled: computed(() => !!account.value !== null),
      queryFn: async () => {
        assertExists(mint, "Mint is not defined");
        assertExists(account.value, "Account is not defined");

        const ata = await getAssociatedTokenAccount({
          mint: address(mint.toBase58()),
          owner: address(account.value),
        });

        try {
          const balance = await rpc.getTokenAccountBalance(ata).send();
          return {
            value: balance.value.uiAmount || 0,
            symbol: "EFFECT",
          };
        } catch (e) {
          return {
            value: 0,
            symbol: "EFFECT",
          };
        }
      },
    });
  };

  return { rpc, rpcSubscriptions, useGetEffectBalanceQuery };
};
