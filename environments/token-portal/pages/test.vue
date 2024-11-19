<template>
    <div>
        <WalletMultiButton/>
        <UButton color="black" @click="check">Check</UButton>
        <UButton color="black" @click="connect">Login Eos</UButton>
    </div>
</template>

<script setup>
import { WalletMultiButton, useWallet } from 'solana-wallets-vue';

const { connect } = useEosWallet()

window.solana.on("connect", () => {
    console.log("connected")
})  

window.solana.on("disconnect", () => {
    console.log("disconnected")
})  

const { signMessage } = useWallet()
const check = async () => {
    await window.solana.connect()
    // signMessage.value(Buffer.from("test"))
}
</script>

<style lang="scss" scoped></style>