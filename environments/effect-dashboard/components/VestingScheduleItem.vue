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
                        {{ new Date(vestingAccount.account.startTime.toNumber() * 1000).toLocaleString() }}</span>
                </div>
            </div>
            <div class="flex flex-col items-end gap-2">
                <UBadge v-if="!scheduleStarted(vestingAccount.account.startTime)" color="gray" variant="outline">
                    Locked
                </UBadge>
                <UButton v-else-if="amountDue" color="gray" variant="solid" size="sm" icon="i-heroicons-gift"
                    @click="">
                    Claim {{ formatAmountToBalance(amountDue) }} EFFECT
                </UButton>
                <UButton v-else-if="progress == 100" color="gray" variant="solid" size="sm" icon="i-heroicons-gift"
                    @click="closeVestingHandler">
                    Close
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
import { useDeriveVestingAccounts } from '@effectai/utils';

const { vestingProgram, useClaim } = useVestingProgram()

const props = defineProps<{
    vestingAccount: VestingAccount
}>()

const { useGetTokenAccountBalanceQuery } = useSolanaWallet()

const { vestingVaultAccount } = useDeriveVestingAccounts({
    vestingAccount: props.vestingAccount.publicKey,
    programId: vestingProgram.value.programId,
})

const { data: balance } = useGetTokenAccountBalanceQuery(vestingVaultAccount)

const scheduleStarted = (timestamp: BN) => {
    return Date.now() > timestamp.toNumber() * 1000
}

const { mutateAsync: claim } = useClaim()
const claimTokens = async () => {
    await claim({ address: props.vestingAccount.publicKey, vestingAccount: props.vestingAccount })
}

const amountDue = computed(() => {
    if (!balance.value) return 0
    return new BN(calculateDue(
        props.vestingAccount.account.startTime.toNumber(),
        props.vestingAccount.account.releaseRate.toNumber(),
        props.vestingAccount.account.distributedTokens.toNumber(),
        balance.value.value
    ))
})

const progress = computed(() => {
    if (!balance.value || !amountDue.value) return 100
    return formatAmountToBalance(amountDue.value.add(props.vestingAccount.account.distributedTokens)) / balance.value.value * 100
})

const calculateDue = (
    startTime: number,
    releaseRate: number,
    distributedTokens: number,
    amountAvailable: number
): number => {
    // get now as a unix timestamp
    const now = Math.floor(new Date().getTime() / 1000);

    if(now < startTime) {
        return 0;
    }

    const poolAmount = (now - startTime) * releaseRate;

    const amountDue = poolAmount - distributedTokens;
    return Math.min(amountDue, amountAvailable * 1_000_000);
}

const closeVestingHandler = async () => {
    console.log('close vesting account')
}
</script>

<style lang="scss" scoped></style>