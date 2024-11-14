<template>
    <UContainer>
        <h1 class="title">Welcome back</h1>
        <h2 class="subtitle">Your Solana account is connected</h2>
        <p>your public key: {{ publicKey }}</p>
        <p>Your balance: {{ balance }}</p>

        <div v-if="!account">
            <p>It looks like you don't have an account yet. Let's create one for you.</p>
            <UButton @click="createAccount">Create account</UButton>
        </div>

        <div>
            <p>Next up, choose the account you want to migrate</p>

            <div class="gap-5 flex my-5">
                <nuxt-link :to="'/migrate-bsc'">
                    <UButton>I want to migrate a BSC wallet</UButton>
                </nuxt-link>
                <UButton>I want to migrate an EOS wallet</UButton>
            </div>
        </div>
    </UContainer>
</template>

<script setup>
import { useWallet } from "solana-wallets-vue";
const { useEffectTokenAccount } = useSolana()
const { publicKey } = useWallet()

const router = useRouter()

const { account, balance, createAccount } = useEffectTokenAccount()

watchEffect(() => {
    if (!publicKey.value) {
        router.push("/")
    }
}, { immediate: true })

</script>

<style lang="scss" scoped></style>