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
        useGetBalanceQuery: eosBalanceQuery,
        useGetEfxBalanceQuery: eosEfxBalanceQuery,
        getForeignPublicKey:  eosGetForeignPublicKey,
        authorizeTokenClaim: authorizeEos,
    } = useEosWallet();
    
    const {
        address: bscAddress,
        walletMeta: bscWalletMeta,
        isConnected: isConnectedBsc,
        useGetBalanceQuery: bscBalanceQuery,
        useGetEfxBalanceQuery: bscEfxBalanceQuery,
        authorizeTokenClaim: authorizeBsc,
        disconnect: disconnectBsc,
        getForeignPublicKey:bscGetForeignPublicKey,
        connect: connectBsc,
    } = useBscWallet();
    
    const address = computed(() => {
        if (isConnectedEos.value) return eosAddress.value;
        if (isConnectedBsc.value) return bscAddress.value;
        return undefined;
    })

    const authorize = async (destinationAddress:string) => {
        if (isConnectedEos.value) return authorizeEos(destinationAddress);
        return authorizeBsc(destinationAddress);
    }

    const walletMeta = computed(() => {
        if (isConnectedEos.value) return eosWalletMeta.value;
        if (isConnectedBsc.value) return bscWalletMeta.value;
        return undefined;
    })

    const efxBalanceQuery = computed(() => {
        if (isConnectedEos.value) return eosEfxBalanceQuery();
        return bscEfxBalanceQuery();
    })

    const balanceQuery = computed(() => {
        if (isConnectedEos.value) return eosBalanceQuery();
        return bscBalanceQuery();
    })

    const getForeignPublicKey = async () => {
        if (isConnectedEos.value) return eosGetForeignPublicKey();
        return bscGetForeignPublicKey();
    }

    const useGetForeignPublicKeyQuery = () => {
        return useQuery({
            queryKey: ["foreign-public-key", address.value],
            queryFn: async () => {
                return getForeignPublicKey();
            },
            enabled: computed(() => isConnectedEos.value || isConnectedBsc.value),
        })
    }

    return {
        useGetForeignPublicKeyQuery,
        useGetBalanceQuery: () => balanceQuery.value,
        useGetEfxBalanceQuery: () => efxBalanceQuery.value,
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
}