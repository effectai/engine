import type { SourceWallet } from "@/lib/wallet-types";
import { useQuery } from "@tanstack/react-query";

export const useGetSourceEfxBalanceQuery = (
  sourceWallet: SourceWallet | null,
) => {
  const enabled = Boolean(
    sourceWallet?.address && sourceWallet?.getNativeBalance,
  );
  return useQuery({
    queryKey: ["source-efx-balance", sourceWallet?.address?.toString()],
    queryFn: async () => {
      if (!sourceWallet?.getEfxBalance) return null;
      return await sourceWallet.getEfxBalance();
    },
    enabled,
  });
};
