<template>
    <UContainer>
        <h1 class="title">Welcome back</h1>
        <h2 class="subtitle">Your Solana account is connected</h2>
        <p>your public key: {{ publicKey }}</p>

        <p>Next up, choose the account you want to migrate</p>

        <div class="gap-5 flex my-5">
            <nuxt-link :to="'/migrate-bsc'"><UButton>I want to migrate a BSC wallet</UButton></nuxt-link>
            <UButton>I want to migrate an EOS wallet</UButton>
        </div>
    </UContainer>
</template>

<script setup>
import { useWallet } from "solana-wallets-vue";
const { publicKey } = useWallet()

const router = useRouter()

watchEffect(() => {
    if (!publicKey.value) {
        router.push("/")
    }
}, { immediate: true })

</script>

<style lang="scss" scoped></style>