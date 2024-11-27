<template>
    <UCard class="flex flex-col dark:!bg-[#1C1A1F]">
        <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="dark:!bg-[#1C1A1F] p-6 rounded-xl">
                <h3 class="text-lg font-semibold mb-6">Unstake Tokens</h3>
                <div class="space-y-6">
                    <div><label class="block text-sm text-gray-400 mb-2">Amount to Unstake</label>
                        <div class="relative"><input type="text" v-model="unstakeAmount"
                                class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700"
                                placeholder="0.00">
                            <UButton @click="setMaxAmount"
                            color="black"
                                class="absolute bg-brand-highlight right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-gray-800 rounded-md text-sm">
                                MAX</UButton>
                        </div>
                    </div>
                    <div class="bg-white/5 rounded-lg py-4 px-2 space-y-2">
                        <div class="flex justify-between text-sm"><span class="text-gray-400">Total Staked
                                Tokens</span><span>{{ stakeAmount }} EFFECT</span></div>
                        <div class="flex justify-between text-sm"><span class="text-gray-400">Lock Period</span><span>30
                                Days</span>
            
                        </div>
                        <div class="flex justify-between text-sm"><span class="text-gray-400">Unstake Delay
                                </span><span>7 Days</span></div>
                      
                    </div>
                    <UButton @click="handleSubmit" color="white" class="flex justify-center w-full">Unstake</UButton>
                </div>
            </div>

        </form>
    </UCard>
</template>

<script setup lang="ts">

const { useUnstake, useGetStakeAccount } = useStakingProgram();
const { amountFormatted: stakeAmount } = useGetStakeAccount()
const { mutateAsync: unstake, isPending } = useUnstake();

const unstakeAmount = ref<number>(0);

const setMaxAmount = () => {
    unstakeAmount.value = stakeAmount.value;
}

const handleSubmit = async () => {
    const tx = await unstake({ amount: unstakeAmount.value })
    console.log(tx)
}
</script>

<style lang="scss" scoped></style>