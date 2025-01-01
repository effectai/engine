import type { PublicKey } from "@solana/web3.js"
import type { UseQueryReturnType } from "@tanstack/vue-query"

export type FormattedBalanceReturnType = {
    value: number
    symbol: string
}

export type WalletConnectionMeta = {
    name: string | undefined
    icon: string | undefined
    chain: string
    permission?: string
    chainId?: string
}

export type WalletBase = {
    address: Ref<string | undefined>
    walletMeta: Ref<WalletConnectionMeta | null | undefined>
    isConnected: Ref<boolean>

    getEfxBalance: () => Promise<FormattedBalanceReturnType>
    useGetEfxBalanceQuery?: () => UseQueryReturnType<FormattedBalanceReturnType, Error>

    getNativeBalance: () => Promise<FormattedBalanceReturnType>
    useGetNativeBalanceQuery?: () => UseQueryReturnType<FormattedBalanceReturnType, Error>;

    connect: () => void;
    disconnect: () => void;
}

// Target Chain Wallet Adapter Type (solana) 
export type TargetWalletAdapter = WalletBase & {
    useGetTokenAccountBalanceQuery: (account: PublicKey) => UseQueryReturnType<FormattedBalanceReturnType, Error>;
}

export type SourceWallet = WalletBase & {
    getForeignPublicKey: () => Promise<Uint8Array>;
    authorizeTokenClaim: (destinationAddress: string) => Promise<{
        foreignPublicKey: Uint8Array;
        signature: Uint8Array;
        message: Uint8Array;
    }>;
}

// Source Chain Wallet Adapter Type (eos, bsc)
export type SourceWalletAdapter = SourceWallet & {
    useGetBalanceQuery: () => UseQueryReturnType<FormattedBalanceReturnType, Error>;
    useGetEfxBalanceQuery: () => UseQueryReturnType<FormattedBalanceReturnType, Error>
    useGetForeignPublicKeyQuery: () => UseQueryReturnType<Uint8Array, Error>;
    authorizeTokenClaim: (destinationAddress: string) => Promise<{
        foreignPublicKey: Uint8Array;
        signature: Uint8Array;
        message: Uint8Array;
    }>;
}