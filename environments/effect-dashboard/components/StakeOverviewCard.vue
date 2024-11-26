<template>
    <UCard class="flex flex-col">
        <div class="flex flex-col">
            <p>Your current stake: <span>{{ stakeAccount?.data?.amount }} EFFECT</span></p>
            <p>unstake duration: <span>{{ unstakeDays }} </span></p>
            <p>xEffect: <span>{{ stakeAccount?.data?.xefx }} </span></p>

            <p>reflection: {{ rewardAccount?.reflection }}</p>
            <p>rate: {{ reflectionAccount?.rate }}</p>
            <p>xefx: {{ rewardAccount?.xefx }}</p>
            
            pending reward:
            {{ pendingRewards }}
            <UButton @click="handleSubmit" color="black">Claim</UButton>
            <UButton @click="addFee" color="black">add fee</UButton>
        </div>
    </UCard>
</template>

<script setup lang="ts">
const { useGetStakeAccount, useClaimRewards, useGetRewardAccount, useGetReflectionAccount, useAddFee } = useStakingProgram();

const { data: stakeAccount } = useGetStakeAccount();
const { data: rewardAccount } = useGetRewardAccount();
const { data: reflectionAccount } = useGetReflectionAccount();

const { mutateAsync: doAddFee } = useAddFee();
const addFee = async () => {
    await doAddFee({
     amount: 5,   
    });
}   

const { mutateAsync: claimRewards } = useClaimRewards();

const pendingRewards = computed(() => {
    const reward = (rewardAccount.value?.reflection / reflectionAccount.value?.rate) -
        rewardAccount.value?.xefx;
    return +(reward / 1e6).toFixed(4);
})

const unstakeDays = computed(
    () =>
        stakeAccount.value?.data?.duration &&
        stakeAccount.value?.data?.duration.toNumber() / 86400,
);

const handleSubmit = async () => {
    const tx = await claimRewards();
    console.log(tx)
}
</script>

<style scoped></style>