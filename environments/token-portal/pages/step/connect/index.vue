<template>
    <UContainer class="text-center">
        <h1 class="title">Let’s get started!</h1>

        <div id="step-content text-center">
            <div v-if="!publicKey" class="flex justify-center flex-col items-center">

                <p class=text-center> First, connect the <u>Solana account</u> where you’d like to receive your Effect tokens airdropped.</p>

                <div class="flex gap-5 my-5">
                    <WalletMultiButton />
                    <UButton color="black"> I don't have a solana account</UButton>
                </div>
            </div>

            <div v-else class="mt-5"> 
                <p class="text-sm">Connected to account: </p>
                <p class="text-mono">{{ publicKey }}</p>
                <div v-if="!account" class="mt-5">
                    <p>It seems like you don't have an associated token account yet for the new Effect Token on
                        solana.
                        Let's create one for you.</p>
                    <UButton @click="createAccount" color="black">Create Account</UButton>
                </div>

                <div class="flex gap-3 mt-5 justify-center items-center">
                    <UButton @click="nextStep" :disabled="!account" color="black">Look's good!</UButton>
                    <a @click="disconnect" class="text-red-500 text-sm cursor-pointer">Logout</a>
                </div>
            </div>
        </div>
    </UContainer>
</template>

<script setup>
import { WalletMultiButton, useWallet } from "solana-wallets-vue";

const { publicKey, disconnect: _disconnect } = useWallet();

const {clear} = useClaim()
const { useEffectTokenAccount } = useSolana();
const { account, createAccount } = useEffectTokenAccount();

const router = useRouter();

const disconnect = () => {
    clear();
    _disconnect();
}

const nextStep = () => {
    router.push("/step/verify");
}

</script>

<style lang="scss" scoped></style>