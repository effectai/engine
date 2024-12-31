<template>
    <UCard class="flex flex-col" v-if="publicKey">
        <div class="flex flex-col gap-5">
            <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-gray-800 text-white rounded-lg flex">
                        <UIcon name="lucide:wallet" class="" />
                    </div>
                    <div class="flex-grow flex justify-between">
                        <div>
                            <div class="flex items-center">
                                <p class="text-sm text-gray-400">Total Staked</p>
                            </div>
                            <p class="text-2xl font-bold">{{ stakeAmount || "0" }} EFFECT</p>
                        </div>
                        <div v-if="stakeAmount">
                            <UTooltip :ui="{ width: 'max-w-md' }"
                                text="Staked tokens in January 2025 get a 2.5x reward ratio">
                                <UBadge label="BOOSTED" class="rainbow-border ml-2" color="gray">
                                    <template #trailing>
                                        <UIcon name="i-heroicons-fire" class="h-6 w-6 text-lg" size="lg"  />
                                    </template>
                                </UBadge>
                            </UTooltip>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-gray-800 rounded-lg text-white flex">
                        <UIcon name="lucide:chart-spline" />
                    </div>
                    <div>
                        <p class="text-sm text-gray-400">Stake Age</p>
                        <AnimatedNumber easing="easeInOutCubic" :value="stakeAge" :format="formatNumber"
                            class="text-2xl font-bold flex relative">{{ stakeAge }}
                        </AnimatedNumber>
                    </div>
                </div>
            </div>
            <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
                <h3 class="text-lg font-semibold mb-4">Staking Statistics</h3>
                <div class="space-y-4">
                    <div class="flex justify-between"><span class="text-gray-400">Your Stake</span><span
                            class="font-medium">{{
                                stakeAmount || 0 }} EFFECT</span></div>
                    <div class="flex justify-between"><span class="text-gray-400">Lock Period</span><span
                            class="font-medium">{{
                                unstakeDays || 0 }} Days</span></div>

                    <div class="flex justify-between"><span class="text-gray-400">Expected APY</span><span
                            class="font-medium">30%</span></div>
                    <div class="flex justify-between"><span class="text-gray-400">Pending Rewards</span><span
                            class="font-medium">{{
                                pendingRewards || 0 }} EFFECT</span></div>

                    <UButton v-if="pendingRewards > 0" @click="handleSubmit" color="white"
                        class="flex justify-center w-full">Claim
                    </UButton>
                </div>
            </div>

            <div class="flex w-full gap-5">
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "solana-wallets-vue";

const {
    useGetStakeAccount,
} = useStakingProgram();

const { useGetRewardAccount, useClaimRewards, useGetReflectionAccount } = useRewardProgram();
const { publicKey } = useWallet();

/**
 * Stake age Logic
 */
const { data: stakeAccount, unstakeDays, amountFormatted: stakeAmount } = useGetStakeAccount();

const stakeAge = computed(() => {
    if (!stakeAccount.value?.account.stakeStartTime || !currentTime.value) return 0;
    return calculateStakeAge(stakeAccount.value.account.stakeStartTime.toNumber())
});

const currentTime = ref(new Date().getTime() / 1000);
onMounted(() => {
    const interval = setInterval(() => {
        currentTime.value = new Date().getTime() / 1000
    }, 5000);

    onUnmounted(() => clearInterval(interval));
});

/**
 * Reward Logic
 */
const { data: reflectionAccount } = useGetReflectionAccount();
const { data: rewardAccount } = useGetRewardAccount(stakeAccount);
const { mutateAsync: claimRewards } = useClaimRewards();
const pendingRewards = computed(() => {
    if (!rewardAccount.value || !reflectionAccount.value) return 0;

    const reflection = rewardAccount.value.reflection;
    const rate = reflectionAccount.value.rate;
    const weightedAmount = rewardAccount.value.weightedAmount;

    if (!reflection || !rate || !weightedAmount) return 0;

    // check if rate is 0
    if (rate.eq(new BN(0))) return 0;

    try {
        const reward = reflection.div(rate).sub(weightedAmount);
        return +(reward.toNumber() / 1e6).toFixed(4);
    } catch (error) {
        console.error('Error calculating pending rewards:', error);
        return 0;
    }
});
const toast = useToast();
const handleSubmit = async () => {
    try {

        if (!stakeAccount.value) {
            throw new Error('No stake account found');
        }

        const tx = await claimRewards({
            stakeAccount: stakeAccount.value,
        });

        toast.add({ title: 'Success', description: 'Claimed rewards', color: 'green' });
    } catch (e) {
        console.error(e);
        toast.add({ title: 'Error', description: 'Something went wrong', color: 'red' });
    }
};
</script>

<style scoped>
.rainbow-border {
    --angle: 0deg;
    border: 1px solid;
    border-radius: 0.375rem;
    border-image: conic-gradient(from var(--angle), red, yellow, lime, aqua, blue, magenta, red) 1;
    background: none;
    animation: 10s rotate linear infinite;
}

@keyframes rotate {
    to {
        --angle: 360deg;
    }
}

@property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}
</style>