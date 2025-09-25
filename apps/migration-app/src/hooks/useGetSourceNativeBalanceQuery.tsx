import type { SourceWallet } from "@/lib/wallet-types";
import { useQuery } from "@tanstack/react-query";

export const useGetSourceNativeBalanceQuery = (
  sourceWallet: SourceWallet | null,
) => {
  const enabled = Boolean(
    sourceWallet?.address && sourceWallet?.getNativeBalance,
  );
  return useQuery({
    queryKey: ["source-native-balance", sourceWallet?.address?.toString()],
    queryFn: async () => {
      if (!sourceWallet?.getNativeBalance) return null;
      return await sourceWallet.getNativeBalance();
    },
    enabled,
  });
};
