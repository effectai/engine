<template>
    <div class="">
        <div v-if="!publicKey">
            <div class="flex items-center flex-col justify-center h-96">
                <TheLogo />
                <p>Login to continue.</p>
            </div>
        </div>
        <UTabs v-if="publicKey" :items="items">
            <template #overview="{ item }">
                <div>
                    <StakeOverviewCard />
                </div>
            </template>
            <template #stake="{ item }">
                <div>
                    <StakingForm />
                </div>
            </template>
            <template #unstake>
                <div class="my-5 flex justify-between space-x-5">
                    <UnstakeForm class="flex-grow" />
                    <UnstakesCard />
                </div>
            </template>
        </UTabs>
    </div>
</template>

<script setup lang="ts">
import { useWallet } from 'solana-wallets-vue';

const items = [{
    slot: 'overview',
    label: 'Overview',
    content: 'Finally, this is the content for Tab3'
}, {
    slot: 'stake',
    label: 'Stake',
    content: 'This is the content shown for Tab1'
}, {
    slot: 'unstake',
    label: 'Unstake',
    content: 'And, this is the content for Tab2'
}]

const { publicKey } = useWallet()

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.7s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>