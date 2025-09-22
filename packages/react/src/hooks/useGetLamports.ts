import type { Connection } from "solana-kite";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import type { UseQueryResult } from "@tanstack/react-query";
import type { Lamports } from "@solana/kit";

export const useGetLamports = (
  connection: Connection,
  address: string | null | undefined,
): UseQueryResult<Lamports | null> => {
  const enabled = Boolean(address && connection?.rpc);
  return useQuery(
    {
      queryKey: ["balances", address, "lamports", { scope: "balance" }],
      queryFn: async ({ signal }) => {
        if (!address || !connection) return null;
        return await connection.getLamportBalance(address);
      },
      enabled,
    },
    queryClient,
  );
};
