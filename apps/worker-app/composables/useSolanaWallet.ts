import { getAssociatedTokenAccount } from "@effectai/solana-utils";
import { type Address, address } from "@solana/kit";
import { useQuery } from "@tanstack/vue-query";

export const useSolanaWallet = () => {
  const { connection } = useConnection();

  const useGetBalanceQuery = (account: Ref<Address | string | null>) => {
    return useQuery({
      queryKey: ["solana-balance", account, account.value?.toString()],
      enabled: computed(() => account.value !== null),
      refetchInterval: 15_000,
      queryFn: async () => {
        if (!account.value) {
          throw new Error("No public key");
        }

        const data = await connection.getLamportBalance(account.value);

        return {
          value: data / BigInt(1e9),
          symbol: "SOL",
        };
      },
    });
  };

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
          mint: address(mint),
          owner: address(account.value),
        });

        try {
          const balance = await connection.getTokenAccountBalance({
            tokenAccount: ata,
          });

          return {
            value: balance.uiAmount || 0,
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

  return {
    useGetBalanceQuery,
    useGetEffectBalanceQuery,
  };
};
