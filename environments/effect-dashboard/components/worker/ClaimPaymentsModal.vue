<template>
  <div>
    <UModal v-model:open="data">
      <template #content>
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
                <span
                  class="font-medium text-gray-900 dark:text-white"
                  v-if="balance"
                >
                  Balance: {{ balance.value }} {{ balance.symbol }}
                </span>
              </div>

              <p class="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
                Ensure your node wallet has sufficient SOL to cover transaction
                fees
              </p>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-700 dark:text-gray-300"
                  >Claimable payments</span
                >
                <UBadge
                  v-if="managerPaymentBatches.length"
                  color="neutral"
                  variant="solid"
                >
                  {{ claimablePayments.length }}
                </UBadge>
              </div>

              <!-- Warning Message -->
              <UAlert
                v-show="false"
                v-if="balance && balance.value <= 0.01"
                icon="i-heroicons-exclamation-triangle"
                color="red"
                variant="subtle"
                title="Low SOL Balance"
                description="Please top up your wallet to cover transaction fees."
                class="mt-2"
              />
            </div>
            <UProgress :value="claimingProgress" indicator v-if="isPending">
            </UProgress>
          </template>

          <template #footer>
            <div class="flex justify-end">
              <UButton
                @click="mutateClaimPayments"
                :loading="isClaimingPayments"
                color="neutral"
                variant="solid"
                size="md"
                class="font-medium"
              >
                {{ isClaimingPayments ? "Processing..." : "Claim Payments" }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const { account } = useAuth();
const { useGetBalanceQuery } = useSolanaWallet();
const { useClaimPayments } = usePayments();

const props = defineProps<{
  modelValue: boolean;
  managerPaymentBatches: any[];
}>();

const batchSize = computed(() => props.managerPaymentBatches.length || []);
const totalClaimablePayments = computed(() => {
  return props.managerPaymentBatches.reduce(
    (total, batch) => total + batch.claimablePayments.length,
    0,
  );
});
const totalClaimableAmount = computed(() => {
  return props.managerPaymentBatches.reduce(
    (total, batch) =>
      total +
      batch.claimablePayments.reduce(
        (sum, payment) => sum + payment.state.amount,
        0,
      ),
    0,
  );
});
const claimablePayments = computed(() => {
  return props.managerPaymentBatches.flatMap(
    (batch) => batch.claimablePayments,
  );
});

const canClaim = computed(() => {
  if (!account.value) {
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
const {
  mutateAsync: claimPayments,
  currentProof,
  currentPhase,
  totalProofs,
  isPending,
} = useClaimPayments();

const claimingProgress = computed(
  () => (currentProof.value / totalProofs.value) * 100 || 0,
);

const toast = useToast();
const { data: managers, isFetching, isError, error } = useFetchManagerNodes();

const { mutateAsync: mutateClaimPayments, isPending: isClaimingPayments } =
  useMutation({
    mutationFn: async () => {
      try {
        for (const batch of props.managerPaymentBatches) {
          //TODO:: hacky we need to find an online manager to batch payments..
          const manager = managers.value[0];
          await claimPayments({
            payments: batch.claimablePayments,
            managerPeerId: manager.peerId,
            managerPublicKey: batch.managerPublicKey,
          });
        }

        toast.add({
          title: "Payments Claimed",
          description:
            "Your claimable payments have been successfully transferred to your wallet.",
        });
      } catch (error) {
        toast.add({
          title: "Error Claiming Payments",
          description: error instanceof Error ? error.message : "Unknown error",
          color: "red",
        });
        console.error("Error claiming payments:", error);
      }
    },
  });
</script>

<style lang="scss" scoped></style>
