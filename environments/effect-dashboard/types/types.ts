import type { PublicKey } from "@solana/web3.js"
import type { UseQueryReturnType } from "@tanstack/vue-query"

export type FormattedBalanceReturnType = {
    value: number
    symbol: string
}

export type WalletMeta = {
    name: string | undefined
    icon: string | undefined
}

export type WalletAdapterBase = {
    address: Ref<string | undefined>
    walletMeta: Ref<WalletMeta | null | undefined>
    isConnected: Ref<boolean>

    useGetEfxBalanceQuery: () => UseQueryReturnType<FormattedBalanceReturnType, Error>;
    useGetBalanceQuery: () => UseQueryReturnType<FormattedBalanceReturnType, Error>;

    connect: () => void;
    disconnect: () => void;
}

// Target Chain Wallet Adapter Type (solana) 
export type TargetWalletAdapter = WalletAdapterBase & {
    useGetTokenAccountBalanceQuery: (account: PublicKey) => UseQueryReturnType<FormattedBalanceReturnType, Error>;
}

// Source Chain Wallet Adapter Type (eos, bsc)
export type SourceWalletAdapter = WalletAdapterBase & {
    getForeignPublicKey: () => Promise<Uint8Array>;
    useGetForeignPublicKeyQuery: () => UseQueryReturnType<Uint8Array, Error>;
    authorizeTokenClaim: (destinationAddress: string) => Promise<{
        foreignPublicKey: Uint8Array;
        signature: Uint8Array;
        message: Uint8Array;
    }>;
}