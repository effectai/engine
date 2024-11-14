<template>
    <UContainer class="">
        <div v-if="!publicKey" class="">
            <h1 class="title">Hello There.</h1>
            <h2 class="subtitle">Welcome to the Effect AI Migration Portal</h2>

            <p>Let's get you setup, first of, do you have a solana wallet ?</p>

            <div class="flex gap-5 my-5">
                <UButton color="primary"> I don't have a solana account</UButton>
                <WalletMultiButton />
            </div>
        </div>
    </UContainer>
</template>

<script setup>
import { WalletMultiButton, useWallet } from "solana-wallets-vue";
const { publicKey } = useWallet()

const router = useRouter()

watchEffect(() => {
    if (publicKey.value) {
        router.push("/account")
    }
}, { immediate: true })

</script>

<style lang="scss" scoped></style>