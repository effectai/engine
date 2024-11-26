<template>
	<div class="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-gray-400">
		<div class="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
			<h2 class="text-3xl font-bold text-white mb-6 font-title">Stake Tokens</h2>
			<form @submit.prevent="handleSubmit" class="space-y-6">
				<div class="">
					<div class="relative">
						<UCard class="mb-8 bg-gray-900 ">
							<label for="stakeAmount" class="block text-md font-medium text-gray-400 mb-2">
								Add to Stake
							</label>
							<div class="relative ">
								<input id="stakeAmount" v-model.number="stakeAmount" type="text" inputmode="decimal"
									placeholder="0.00"
									class="w-full px-4 py-3 bg-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
									:class="{ 'border-red-500': error }" />

								<div
									class="flex absolute items-center gap-3 right-2 top-1/2 transform -translate-y-1/2">
									<span class="text-sm text-gray-400" v-if="availableBalance">
										in Wallet: <span class="text-white">{{
											formatNumber(availableBalance.value) }}</span>
									</span>
									<button type="button" @click="setMaxAmount"
										class=" bg-highlight text-black px-3 py-1 rounded-md text-sm font-mono hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-700">
										MAX
									</button>
								</div>
							</div>
							<span class="text-sm mt-1 block">Current stake: {{ amountToBalance(currentStakeAmount || new
								BN(0)) }}</span>
						</UCard>
					</div>
					<p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>
				</div>
				<UButton @click="handleSubmit" variant="outline"
					class="text-white w-full text-center flex-grow justify-center" color="white"
					:disabled="!isValid || isSubmitting">
					{{ isSubmitting ? 'Staking...' : 'Confirm' }}
				</UButton>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
import { BN } from "@coral-xyz/anchor";
import { ref, computed } from "vue";
import { watchOnce } from "@vueuse/core";

const { useGetEfxBalanceQuery } = useSolanaWallet();
const { data: availableBalance } = useGetEfxBalanceQuery();

const { useStake, useTopUp, useGetStakeAccount } =
	useStakingProgram();

const {
	data: stakeAccount,
	amount: currentStakeAmount,
	unstakeDays: currentStakeUnstakeDays,
	error: stakeError,
} = useGetStakeAccount();
const stakeAccountExists = computed(() => !!stakeAccount.value);

const stakeAmount: Ref<number> = ref(0);

type Maybe<T> = T | null | undefined;
const unstakeDays: Ref<Maybe<number>> = ref(null);

watchOnce([stakeError, stakeAccount], () => {
	if (stakeError.value?.message.startsWith("Account does not exist")) {
		unstakeDays.value = 14;
	}

	if (stakeAccount.value) {
		unstakeDays.value = currentStakeUnstakeDays.value;
	}
});

const error = ref("");
const isSubmitting = ref(false);
const isValid = computed(() => {
	if (!stakeAmount.value || !availableBalance.value || !unstakeDays.value) {
		return false;
	}
	const amount = stakeAmount.value;
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

const { mutateAsync: stake } = useStake();
const { mutateAsync: topup } = useTopUp();

const handleSubmit = async () => {
	if (!isValid.value || !unstakeDays.value) {
		error.value = "Invalid stake amount";
		return;
	}

	isSubmitting.value = true;
	error.value = "";

	try {
		const txId = stakeAccountExists.value 
			? await topup({
				amount: Number(stakeAmount.value),
			})
			: await stake({
				amount: Number(stakeAmount.value),
				unstakeDays: 30,
			});
			
		console.log('Transaction ID:', txId);

	} catch (err) {
		console.error(err);
		error.value = "Failed to stake tokens. Please try again.";
	} finally {
		isSubmitting.value = false;
	}
};
</script>