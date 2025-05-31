<template>
  <div>
    <UModal v-model="data">
      <UCard
        :ui="{
          base: 'relative overflow-hidden',
          ring: '',
          divide: 'divide-y divide-gray-200 dark:divide-gray-700',
          body: {
            base: 'space-y-4',
          },
        }"
      >
        <template #header>
          <div class="flex flex-col space-y-1.5">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
              Claim Payments
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Transfer available payments to your wallet
            </p>
          </div>
        </template>

        <template #default>
          <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
            <div class="flex items-center gap-2 flex-wrap">
              <BlockchainAddress v-if="account" :address="account" />
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span class="font-medium text-gray-900 dark:text-white">
                Balance: {{ balance.value }} {{ balance.symbol }}
              </span>
            </div>

            <p class="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
              Ensure your wallet has sufficient SOL to cover transaction fees
            </p>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-700 dark:text-gray-300"
                >Claimable payments</span
              >
              <UBadge v-if="claimablePayments" color="gray" variant="solid">
                {{ claimablePayments.length }}
              </UBadge>
            </div>

            <!-- Warning Message -->
            <UAlert
              v-show="false"
              v-if="balance.value <= 0.01"
              icon="i-heroicons-exclamation-triangle"
              color="red"
              variant="subtle"
              title="Low SOL Balance"
              description="Please top up your wallet to cover transaction fees."
              class="mt-2"
            />
          </div>
          <UProgress :value="claimingProgress" indicator>
            <template #step-0="{ step }">
              <span class="text-lime-500">
                <UIcon name="i-heroicons-arrow-down-circle" />
                {{ progress }}
              </span>
            </template>

            <template #step-1="{ step }">
              <span class="text-amber-500">
                <UIcon name="i-heroicons-circle-stack" /> {{ step }}
              </span>
            </template>

            <template #step-2="{ step }">
              <span class="text-blue-500">
                <UIcon name="i-heroicons-hand-thumb-up" /> {{ step }}
              </span>
            </template>
          </UProgress>
        </template>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              @click="mutateClaimPayments"
              :loading="isClaimingPayments"
              :disabled="!canClaim"
              color="black"
              variant="solid"
              size="md"
              class="font-medium"
            >
              {{ isClaimingPayments ? "Processing..." : "Claim Payments" }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useMutation } from "@tanstack/vue-query";

const authStore = useAuthStore();
const { account } = storeToRefs(authStore);

const { useGetBalanceQuery } = useSolanaWallet();
const { useGetClaimablePayments, useClaimPayments } = usePayments();

const props = defineProps<{
  modelValue: boolean;
}>();

const canClaim = computed(() => {
  if (!account.value) {
    return false;
  }
  if (!claimablePayments.value || claimablePayments.value.length === 0) {
    return false;
  }
  if (!balance.value || balance.value.value <= 0.01) {
    return false;
  }
  return true;
});

const emit = defineEmits(["update:modelValue"]);
const data = useVModel(props, "modelValue", emit);

const { data: balance } = useGetBalanceQuery(account);
const { data: claimablePayments } = useGetClaimablePayments();
const { mutateAsync: claimPayments, progress } = useClaimPayments();

const claimingProgress = computed(
  () => progress.currentProof / progress.totalProofs,
);

const { mutateAsync: mutateClaimPayments, isPending: isClaimingPayments } =
  useMutation({
    mutationFn: async () => {
      if (!claimablePayments.value) {
        console.error("No claimable payments found");
        return;
      }
      await claimPayments({ payments: claimablePayments.value });
    },
  });
</script>

<style lang="scss" scoped></style>
