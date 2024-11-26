<template>
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-gray-400">
        <div class="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
            <h2 class="text-3xl font-bold text-white mb-6 font-title">Unstake Tokens</h2>
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <div class="">
                    <div class="relative">
                        <UCard class="mb-8 bg-gray-900 ">
                            <label for="stakeAmount" class="block text-md font-medium text-gray-400 mb-2">
                                Unstake Amount
                            </label>
                            <div class="relative ">
                                <input
                                    class="w-full px-4 py-3 bg-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                                    v-model.number="unstakeAmount" />
                            </div>
                        </UCard>
                    </div>
                    <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
                </div>
                <UButton @click="handleSubmit" variant="outline"
                    class="text-white w-full text-center flex-grow justify-center" color="white"
                    :disabled="!isValid || isPending">
                    {{ isPending ? 'Staking...' : 'Confirm' }}
                </UButton>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">

const error = ref<string | null>(null);
const isValid = ref<boolean>(true);

const {useUnstake} = useStakingProgram();
const {mutateAsync: unstake, isPending} = useUnstake();

const unstakeAmount = ref<number>(0);

const handleSubmit = async () => {
   const tx = await unstake({amount: unstakeAmount.value})
   console.log(tx)
}
</script>

<style lang="scss" scoped></style>