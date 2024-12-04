<template>
    <div class="p-4 rounded-lg border border-gray-800">
        <div class="flex items-center justify-between w-full">
            <div>
                <p class="font-medium gap-1 flex">
                    <span>{{ balance?.value }}</span>
                    <span>EFFECT</span>
                </p>
                <div class="flex gap-1 text-sm text-gray-400">
                    <span>
                        Starts on:
                        {{ new Date(vestingAccount.startTime.toNumber() * 1000).toLocaleString() }}</span>
                </div>
            </div>
            <div class="flex flex-col items-end gap-2">
                <UBadge v-if="!scheduleStarted(vestingAccount.startTime)" color="gray" variant="outline">
                    Locked
                </UBadge>
                <UButton v-else-if="amountDue" color="gray" variant="solid" size="sm" icon="i-heroicons-gift"
                    @click="claimTokens">
                    Claim {{ formatAmountToBalance(amountDue).toFixed(2) }} EFFECT
                </UButton>
                <p>{{ progress.toFixed(2) }}% completed</p>
            </div>
        </div>
        <div>
            <UProgress :value="progress" :variant="progress < 1 ? 'solid' : 'gradient'" class="mt-2" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { BN } from '@coral-xyz/anchor';
import type { PublicKey } from '@solana/web3.js';

const { vestingProgram, useClaim } = useVestingProgram()

type VestingAccount = Awaited<ReturnType<typeof vestingProgram.account.vestingAccount.fetch>>

const props = defineProps<{
    address: PublicKey,
    vestingAccount: VestingAccount
}>()

const { useGetTokenAccountBalanceQuery } = useSolanaWallet()
const { data: balance } = useGetTokenAccountBalanceQuery(props.vestingAccount.vaultTokenAccount)

const scheduleStarted = (timestamp: BN) => {
    return Date.now() > timestamp.toNumber() * 1000
}

const { mutateAsync: claim } = useClaim()
const claimTokens = async () => {
    await claim({ address: props.address, vestingAccount: props.vestingAccount })
}

const amountDue = computed(() => {
    if (!balance.value) return 0
    return new BN(calculateDue(
        props.vestingAccount.startTime.toNumber(),
        props.vestingAccount.releaseRate.toNumber(),
        props.vestingAccount.distributedTokens.toNumber(),
        balance.value.value
    ))
})

const progress = computed(() => {
    if (!balance.value || !amountDue.value) return 100
    return formatAmountToBalance(amountDue.value) / balance.value.value
})

const calculateDue = (
    startTime: number,
    releaseRate: number,
    distributedTokens: number,
    amountAvailable: number
): number => {

    // get now as a unix timestamp
    const now = Math.floor(new Date().getTime() / 1000);

    const poolAmount = (now - startTime) * releaseRate;

    const amountDue = poolAmount - distributedTokens;

    return Math.min(amountDue, amountAvailable * 1_000_000);
}
</script>

<style lang="scss" scoped></style>