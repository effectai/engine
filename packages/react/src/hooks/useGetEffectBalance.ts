import type { Connection } from "solana-kite";
import { address as toAddress } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

export const useGetEffectBalance = (
  connection: Connection,
  tokenAccount: string | null | undefined,
) => {
  const enabled = Boolean(tokenAccount && connection?.rpc);
  return useQuery(
    {
      queryKey: ["balances", tokenAccount ?? "unknown", { scope: "balance" }],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        if (!tokenAccount || !connection) return null;

        return await connection.getTokenAccountBalance({
          tokenAccount: toAddress(tokenAccount),
        });
      },
      enabled,
    },
    queryClient,
  );
};
