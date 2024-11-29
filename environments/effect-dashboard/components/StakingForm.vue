<template>
	<UCard class="flex flex-col">
		<form @submit.prevent="handleSubmit" class="space-y-6">
			<div class="bg-white/5 p-6 rounded-xl">
				<h3 class="text-lg font-semibold mb-6">Stake Tokens</h3>
				<div class="space-y-6">
					<div><label class="block text-sm text-gray-400 mb-2">Amount to Stake</label>
						<div class="relative"><input type="text" v-model="stakeAmount"
								class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700"
								placeholder="0.00">
							<UButton @click="setMaxAmount" color="black"
								class="absolute bg-brand-highlight right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-gray-800 rounded-md text-sm">
								MAX</UButton>
						</div>
					</div>
					<div class="bg-white/5 rounded-lg py-4 space-y-2">
						<div class="flex justify-between text-sm"><span class="text-gray-400">Available
								Balance</span><span>{{ availableBalance?.value }} EFFECT</span></div>
						<div class="flex justify-between text-sm"><span class="text-gray-400">Lock Period</span><span>30
								Days</span></div>
					</div>
					<UButton @click="handleSubmit" color="white" class="flex justify-center w-full">Stake</UButton>
				</div>
			</div>

		</form>
	</UCard>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { watchOnce } from "@vueuse/core";

const { useGetEfxBalanceQuery } = useSolanaWallet();
const { data: availableBalance } = useGetEfxBalanceQuery();

const { useStake, useTopUp, useGetStakeAccount } = useStakingProgram();

const {
	data: stakeAccount,
	amount: currentStakeAmount,
	unstakeDays: currentStakeUnstakeDays,
	error: stakeError,
	refetch
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
	if (!availableBalance.value) return;
	stakeAmount.value = availableBalance.value.value;
	error.value = "";
};

const { mutateAsync: stake } = useStake();
const { mutateAsync: topup } = useTopUp();
const toast = useToast();
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
			}) : await stake({
				amount: Number(stakeAmount.value),
				unstakeDays: 30,
			});

		toast.add({
			title: "Transaction submitted",
			description: "Your transaction has been submitted to the network.",
		})

		// refetch the stake account
		refetch();

	} catch (err) {
		console.error(err);
		error.value = "Failed to stake tokens. Please try again.";
	} finally {
		isSubmitting.value = false;
	}
};
</script>