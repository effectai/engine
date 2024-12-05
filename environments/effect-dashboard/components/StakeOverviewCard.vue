<template>
    <UCard class="flex flex-col" v-if="publicKey">
        <div class="flex flex-col gap-5">
            <div class="bg-white/5 p-6 rounded-xl border border-gray-800">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-gray-800 text-white rounded-lg flex">
                        <UIcon name="lucide:wallet" class="" />
                    </div>
                    <div>
                        <p class="text-sm text-gray-400">Total Staked</p>
                        <p class="text-2xl font-bold">{{ stakeAmount || "0" }} EFFECT</p>
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
                            class="text-2xl font-bold flex relative">{{ (stakeAge).toFixed(4) }}
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
                    <div class="flex justify-between" v-if="reflectionAccount?.totalXefx"><span
                            class="text-gray-400">Total
                            Staked</span><span class="font-medium">{{ formatAmountToBalance(reflectionAccount.totalXefx)
                            }}
                            EFFECT</span></div>
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
    if (!stakeAccount.value?.account.stakeStartTime) return 0;
    const time = currentTime.value - stakeAccount.value.account.stakeStartTime.toNumber()
    return time;
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
const { data: rewardAccount } = useGetRewardAccount();
const { mutateAsync: claimRewards } = useClaimRewards();
const pendingRewards = computed(() => {
    const reward =
        rewardAccount.value?.reflection / reflectionAccount.value?.rate -
        rewardAccount.value?.xefx;
    return +(reward / 1e6).toFixed(4);
});
const handleSubmit = async () => {
    if (!stakeAccount.value) {
        throw new Error('No stake account found');
    }

    const tx = await claimRewards({
        stakeAccount: stakeAccount.value,
    });
};
</script>

<style scoped></style>