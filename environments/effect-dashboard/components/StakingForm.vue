<template>
  <UCard class="flex flex-col">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="p-6 rounded-xl">
        <h3 class="text-lg font-semibold mb-6">Stake Tokens</h3>
        <div class="space-y-6">
          <div>
            <label class="block text-gray-400 mb-2">Amount to Stake</label>
            <div class="relative">
              <input
                type="text"
                v-model="stakeAmount"
                class="w-full bg-white/5 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-700"
                placeholder="0.00"
              />
              <UButton
                @click="setMaxAmount"
                color="neutral"
                class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded-md text-sm"
              >
                MAX</UButton
              >
            </div>
          </div>

          <div class="bg-white/5 rounded-lg py-4 px-2 space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-400">Total Staked Tokens</span
              ><span>{{ formatNumber(stakeAmountFormatted) || 0 }} EFFECT</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Available Balance</span
              ><span>{{ availableBalance?.value }} EFFECT</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Lock Period</span><span>30 Days</span>
            </div>
          </div>
          <UButton
            :loading="isPending"
            :disabled="!isValid"
            @click="handleSubmit"
            color="neutral"
            class="flex justify-center w-full"
            >Stake</UButton
          >
        </div>
      </div>
    </form>
  </UCard>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const emit = defineEmits(["submit"]);

const { useGetEfxBalanceQuery } = useSolanaWallet();
const { data: availableBalance } = useGetEfxBalanceQuery();

const { useStake, useTopUp, useGetStakeAccount } = useStakingProgram();

const {
  data: stakeAccount,
  amountFormatted: stakeAmountFormatted,
  refetch,
} = useGetStakeAccount();

const stakeAmount: Ref<number> = ref(0);

type Maybe<T> = T | null | undefined;
const unstakeDays: Ref<Maybe<number>> = ref(30);

const error = ref("");
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

const { mutateAsync: stake, isPending } = useStake();
const { mutateAsync: topup } = useTopUp();
const toast = useToast();

const handleSubmit = async () => {
  try {
    if (!isValid.value || !unstakeDays.value) {
      error.value = "Invalid stake amount";
      return;
    }

    error.value = "";

    stakeAccount.value
      ? await topup({
          stakeAccount: stakeAccount.value,
          amount: Number(stakeAmount.value),
        })
      : await stake({
          amount: Number(stakeAmount.value),
        });

    toast.add({
      title: "Transaction submitted",
      description: "Your transaction has been submitted to the network.",
    });

    // refetch the stake account
    refetch();

    emit("submit");
  } catch (err) {
    console.error(err);
    error.value = "Failed to stake tokens. Please try again.";
  }
};
</script>
