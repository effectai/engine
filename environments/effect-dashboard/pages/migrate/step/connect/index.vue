<template>
    <div class="text-center">
        <ClaimProgress  class="my-5" v-motion :initial="{ opacity: 0, scale: 0.7 }" :enter="{ opacity: 1, scale: 1 }"
            :delay="300" :duration="600" />

        <div v-motion :initial="{ opacity: 0, scale: 0.7 }" :enter="{ opacity: 1, scale: 1 }" :delay="0"
            :duration="600">
            <UCard class="w-full">
                <template #header>
                    <h2 class="title">Connect Solana Wallet</h2>
                </template>
                <div class="w-full">
                    <div v-if="!address">
                        <p class="text-center text-lg"> First, connect the <u>Solana wallet</u> on which you’d like to
                            receive
                            your claimed
                            tokens.</p>
                        <div class="flex gap-5 mt-10 justify-center items-center text-black-500 underline text-sm">
                            <ClientOnly>
                                <WalletMultiButton />
                            </ClientOnly>
                            <nuxt-link color="black"> I don't have a solana account</nuxt-link>
                        </div>
                    </div>
                    <div v-else>
                        <WalletCard v-if="address && walletMeta" :walletMeta="walletMeta" chain="solana"
                            :balance-query="useGetBalanceQuery" :efx-balance-query="useGetEfxBalanceQuery"
                            :address="address" @disconnect="disconnect">
                            <template #action>
                                <SolanaExplorerButton type="account" :hash="address" />
                                <UButton color="black" @click="nextStep" class="flex-grow justify-center flex">
                                    Yes, use this wallet
                                </UButton>
                            </template>
                        </WalletCard>
                    </div>
                </div>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import { WalletMultiButton } from "solana-wallets-vue";

const { clear } = useGlobalState();
const { useGetBalanceQuery, useGetEfxBalanceQuery, address, disconnect: _disconnect, walletMeta } = useSolanaWallet()

const router = useRouter();

const disconnect = () => {
    clear();
    _disconnect();
}

const nextStep = () => {
    router.push("/migrate/step/verify");
}

</script>

<style lang="scss" scoped></style>