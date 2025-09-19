import type { Connection } from "solana-kite";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

export const useGetLamports = (
  connection: Connection,
  address: string | null | undefined,
) => {
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
