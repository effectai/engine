import type { Address } from "@solana/kit";
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
  return {
    useGetBalanceQuery,
  };
};
