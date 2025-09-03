import { useQuery, useQueryClient } from "@tanstack/vue-query";
import type { SourceWalletAdapter } from "~/types/types";

export const useSourceWallet = (): SourceWalletAdapter => {
  const {
    isConnected: isConnectedEos,
    connect: connectEos,
    disconnect: disconnectEos,
    address: eosAddress,
    authorizeTokenClaim: _authorizeEos,
    walletMeta: eosWalletMeta,
    getForeignPublicKey: eosGetForeignPublicKey,
    authorizeTokenClaim: authorizeEos,
    getNativeBalance: eosBalance,
    getEfxBalance: eosEfxBalance,
  } = useEosWallet();

  const {
    address: bscAddress,
    walletMeta: bscWalletMeta,
    isConnected: isConnectedBsc,
    getNativeBalance: bscBalance,
    getEfxBalance: bscEfxBalance,
    authorizeTokenClaim: authorizeBsc,
    disconnect: disconnectBsc,
    getForeignPublicKey: bscGetForeignPublicKey,
    connect: connectBsc,
  } = useBscWallet();

  const address = computed(() => {
    if (isConnectedEos.value) return eosAddress.value;
    if (isConnectedBsc.value) return bscAddress.value;
    return undefined;
  });

  const authorize = async (destinationAddress: string) => {
    if (isConnectedEos.value) return authorizeEos(destinationAddress);
    return authorizeBsc(destinationAddress);
  };

  const walletMeta = computed(() => {
    if (isConnectedEos.value) return eosWalletMeta.value;
    if (isConnectedBsc.value) return bscWalletMeta.value;
    return undefined;
  });

  const useGetEfxBalanceQuery = () => {
    return useQuery({
      queryKey: ["efx-balance", address.value],
      queryFn: async () => {
        if (isConnectedEos.value) return eosEfxBalance();
        if (isConnectedBsc.value) return bscEfxBalance();
        throw new Error("No wallet connected");
      },
      enabled: computed(() => isConnectedEos.value || isConnectedBsc.value),
    });
  };

  const useGetNativeBalanceQuery = () => {
    return useQuery({
      queryKey: ["balance", address.value],
      queryFn: async () => {
        if (isConnectedEos.value) return eosBalance();
        if (isConnectedBsc.value) return bscBalance();
        throw new Error("No wallet connected");
      },
      enabled: computed(() => isConnectedEos.value || isConnectedBsc.value),
    });
  };

  const useGetForeignPublicKeyQuery = () => {
    return useQuery({
      queryKey: ["foreign-public-key", address.value],
      queryFn: async () => {
        if (isConnectedEos.value) return eosGetForeignPublicKey();
        if (isConnectedBsc.value) return bscGetForeignPublicKey();
        throw new Error("No wallet connected");
      },
      enabled: computed(() => isConnectedEos.value || isConnectedBsc.value),
    });
  };

  return {
    useGetForeignPublicKeyQuery,
    useGetNativeBalanceQuery,
    useGetEfxBalanceQuery,
    authorizeTokenClaim: authorize,
    address,
    walletMeta,
    isConnected: computed(() => isConnectedEos.value || isConnectedBsc.value),
    connect: async () => {
      if (isConnectedEos.value) return connectEos();
      if (isConnectedBsc.value) return connectBsc();
    },
    disconnect: async () => {
      disconnectEos();
      disconnectBsc();
    },
  };
};
