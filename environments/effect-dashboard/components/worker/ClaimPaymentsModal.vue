<template>
  <UModal v-model:open="data">
    <template #content>
      <UCard
        :ui="{
          base: 'relative overflow-hidden',
          ring: '',
          divide: 'divide-y divide-gray-200 dark:divide-gray-700',
          body: { base: 'space-y-6 py-6' },
        }"
      >
        <!-- Header -->
        <template #header>
          <div class="text-center space-y-1">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Claim Payments
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Transfer your earned EFFECT to your wallet
            </p>
          </div>
        </template>

        <!-- Body -->
        <template #default>
          <!-- Highlighted Claimable Amount -->
          <div class="text-center mb-6">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total Claimable
            </p>
            <div class="text-4xl font-bold text-black dark:text-white">
              {{ claimablePayments.length }} Payments
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 italic mt-1">
              Across {{ managerPaymentBatches.length }} manager(s)
            </p>
          </div>

          <!-- Wallet Info Block -->
          <div
            class="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl text-center"
          >
            <div class="flex items-center gap-2 flex-wrap justify-center">
              <span class="text-gray-500 dark:text-gray-400 text-sm">
                Wallet:
              </span>
              <BlockchainAddress v-if="account" :address="account" />
              <span class="text-gray-400 dark:text-gray-500">|</span>
              <span
                v-if="balance"
                class="font-medium text-sm text-gray-900 dark:text-white"
              >
                Balance: {{ balance.value }} {{ balance.symbol }}
              </span>
            </div>
            <p class="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
              Ensure your wallet has enough SOL for transaction fees.
            </p>
          </div>

          <!-- Progress bar if claiming -->
          <UProgress
            v-if="isPending"
            :value="claimingProgress"
            indicator
            class="mt-4"
          />
        </template>

        <!-- Footer -->
        <template #footer>
          <!-- Warning for low SOL -->
          <UAlert
            v-if="balance && balance.value <= 0.01"
            icon="i-heroicons-exclamation-triangle"
            color="neutral"
            variant="subtle"
            title="Low SOL Balance"
            description="You may not have enough SOL to cover transaction fees."
            class="mt-4"
          />
          <div class="flex justify-center mt-4">
            <UButton
              @click="mutateClaimPayments"
              :loading="isClaimingPayments"
              color="neutral"
              variant="solid"
              size="lg"
              class="font-semibold"
              :disabled="!canClaim || isClaimingPayments"
            >
              {{ isClaimingPayments ? "Processing..." : "Claim Payments" }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useMutation, useQueryClient } from "@tanstack/vue-query";

const { account } = useAuth();
const { useGetBalanceQuery } = useSolanaWallet();
const { useClaimPayments, computedTotalPaymentAmount, useGetPaymentsQuery } =
  usePayments();
const { data: managerPaymentBatches } = useGetPaymentsQuery();

const emit = defineEmits(["update:modelValue"]);
const props = defineProps<{
  modelValue: boolean;
}>();
const data = useVModel(props, "modelValue", emit);

const claimablePayments = computed(() => {
  return managerPaymentBatches.value?.flatMap(
    (batch) => batch.claimablePayments,
  );
});

const canClaim = computed(() => {
  if (!account.value) {
    return false;
  }
  if (
    !managerPaymentBatches.value ||
    managerPaymentBatches.value.length === 0
  ) {
    return false;
  }
  if (!balance.value || balance.value.value <= 0.01) {
    return false;
  }
  return true;
});

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
const queryClient = useQueryClient();

const { mutateAsync: mutateClaimPayments, isPending: isClaimingPayments } =
  useMutation({
    mutationFn: async () => {
      try {
        for (const batch of managerPaymentBatches.value || []) {
          //TODO:: hacky we need to find an online manager to batch payments..
          const manager = managers.value[0];

          if (!manager) {
            throw new Error("No online manager found to claim payments.");
          }

          await claimPayments({
            payments: batch.claimablePayments,
            managerPeerId: manager.peerId,
            managerPublicKey: batch.managerPublicKey,
          });

          queryClient.removeQueries({
            queryKey: ["nonces"],
          });

          queryClient.invalidateQueries({
            queryKey: ["payments"],
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
