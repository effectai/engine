<template>
    <div class="text-center">
        <div id="step-content text-center">
            <div v-if="!address" class="flex justify-center flex-col items-center">
                <h1 class="title">Let’s get started!</h1>

                <p class=text-center> First, connect the <u>Solana account</u> where you’d like to receive your Effect
                    tokens airdropped.</p>

                <div class="flex gap-5 mt-10 justify-center items-center text-black-500 underline text-sm">
                    <WalletMultiButton />
                    <nuxt-link color="black"> I don't have a solana account</nuxt-link>
                </div>
            </div>

            <div v-else class="flex justify-center">
                <WalletCard v-if="address && walletMeta"
                :walletMeta="walletMeta"
                chain="solana"
                :balance-query="useGetBalanceQuery"
                :efx-balance-query="useGetEfxBalanceQuery"
                :address="address" @disconnect="disconnect">
                    <template #action>
                        <SolanaExplorerButton type="account" :hash="address" />
                        <UButton color="black" @click="nextStep" class="flex-grow justify-center flex">
                            Next
                        </UButton>
                    </template>
                </WalletCard>
            </div>
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