<template>
	<div class="min-h-screen bg-gray-900 flex items-center justify-center p-6">
		<div class="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
			<h2 class="text-3xl font-bold text-white mb-6 font-title">Stake Tokens</h2>
			<form @submit.prevent="handleSubmit" class="space-y-6">
				<div>
					<label for="stakeAmount" class="block text-sm font-medium text-gray-400 mb-2">
						Amount to Stake
					</label>
					<div class="relative">
						<div class="relative">
							<input id="stakeAmount" v-model="stakeAmount" type="text" inputmode="decimal"
								placeholder="0.00"
								class="w-full px-4 py-3 bg-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
								:class="{ 'border-red-500': error }" />
							<button type="button" @click="setMaxAmount"
								class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-highlight text-black px-3 py-1 rounded-md text-sm font-mono hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-700">
								MAX
							</button>
						</div>
						<div>
							<label for="stakeAmount" class="block text-sm font-medium text-gray-400 mb-2 mt-5">
								Duration to stake
							</label>

							<input id="unstakeDays" v-model="unstakeDays" type="number" inputmode="decimal"
								placeholder="14"
								class="w-full px-4 py-3 bg-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
								:class="{ 'border-red-500': error }" />

						</div>
					</div>
					<p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
				</div>
				<div>
					<p class="text-sm text-gray-400">
						Available Balance: <span class="text-white">{{ formatNumber(availableBalance.value) }}</span>
					</p>
				</div>

				<UButton @click="handleSubmit" variant="outline" class="text-white" color="white"
					:disabled="!isValid || isSubmitting">
					{{ isSubmitting ? 'Staking...' : 'Stake Tokens' }}
				</UButton>
			</form>
		</div>
	</div>
</template>

<script setup>
import { ref, computed } from "vue";

const { useGetEfxBalanceQuery } = useSolanaWallet();
const { data: availableBalance } = useGetEfxBalanceQuery();

const { useStake } = useStakingProgram();
const { mutateAsync: stake } = useStake();

const handleStake = () => {
}

const stakeAmount = ref("");
const unstakeDays = ref(0);
const error = ref("");
const isSubmitting = ref(false);

const isValid = computed(() => {
	const amount = Number.parseFloat(stakeAmount.value);
	return amount > 0 && amount <= availableBalance.value.value;
});

const setMaxAmount = () => {
	stakeAmount.value = availableBalance.value.value;
	error.value = "";
};

const formatNumber = (num) => {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
};

const handleSubmit = async () => {
	if (!isValid.value) {
		error.value = "Invalid stake amount";
		return;
	}

	isSubmitting.value = true;
	error.value = "";

	try {
		const txId = await stake({ amount: stakeAmount.value, unstakeDays: 0 });
	} catch (err) {
		console.log(err)
		error.value = "Failed to stake tokens. Please try again.";
	} finally {
		isSubmitting.value = false;
	}
};
</script>