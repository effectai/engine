import type { Connection } from "solana-kite";
import { address as toAddress, type Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { useProfileContext } from "@/providers/ProfileContextProvider";
import { queryClient } from "@/lib/query-client";
import type { UseQueryResult } from "@tanstack/react-query";

export const useGetEffectTokenAccount = (
  connection: Connection | null,
  walletAddress: string | null | undefined,
): UseQueryResult<Address<string> | null> => {
  const enabled = Boolean(walletAddress && connection?.rpc);
  const { mint } = useProfileContext();

  return useQuery(
    {
      queryKey: ["effectTokenAccount", walletAddress],
      queryFn: async () => {
        if (!walletAddress || !connection) return null;

        return await connection.getTokenAccountAddress(
          toAddress(walletAddress),
          mint,
        );
      },
      enabled,
    },
    queryClient,
  );
};
