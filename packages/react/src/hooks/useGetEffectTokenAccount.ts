import type { Connection } from "solana-kite";
import { address as toAddress } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { useProfileContext } from "@/providers/ProfileContextProvider";
import { queryClient } from "@/lib/query-client";

export const useGetEffectTokenAccount = (
  connection: Connection | null,
  walletAddress: string | null | undefined,
) => {
  const enabled = Boolean(walletAddress && connection?.rpc);
  const { mint } = useProfileContext();

  return useQuery(
    {
      queryKey: ["effectTokenAccount", walletAddress],
      queryFn: async ({ signal }) => {
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
