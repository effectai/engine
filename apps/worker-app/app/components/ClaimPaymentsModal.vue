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
              {{ totalAmount }} EFFECT Across
              {{ managerPaymentBatches.length }} Batches(s)
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
          <div class="mb-7">
            <label
              class="block mt-2 mb-4 text-sm text-gray-700 dark:text-gray-300"
            >
              Batch Length: {{ batchLength * 60 }}
              <span class="text-xs text-gray-500 dark:text-gray-400">
                (Max number of payments to claim at once)
              </span>
            </label>

            <USlider
              :disabled="!canClaim || isClaimingPayments"
              :min="1"
              color="neutral"
              v-model="batchLength"
              :max="maxBatchLength"
              tooltip
            />
          </div>

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
import { multiaddr } from "@effectai/protocol-core";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { useVModel } from "@vueuse/core";

const { account } = useAuth();
const { instance } = storeToRefs(useWorkerStore());
const { useGetBalanceQuery } = useSolanaWallet();

const { useClaimPayments, computedTotalPaymentAmount, useGetPaymentsQuery } =
  usePayments();

const { data: managerPaymentBatches } = useGetPaymentsQuery();

const totalAmount = computed(() => {
  if (
    !managerPaymentBatches.value ||
    managerPaymentBatches.value.length === 0
  ) {
    return 0;
  }

  return computedTotalPaymentAmount(managerPaymentBatches);
});

const batchLength = ref(7);
const maxBatchLength = computed(() => {
  return Math.max(managerPaymentBatches.value?.length || 0, 10);
});

const emit = defineEmits(["update:modelValue"]);
const props = defineProps<{
  modelValue: boolean;
}>();
const data = useVModel(props, "modelValue", emit);

const claimablePayments = computed(() => {
  return managerPaymentBatches.value
    ?.filter((b) => b.recipient === account.value)
    .flatMap((batch) => batch.claimablePayments);
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
  if (!balance.value || balance.value.value <= 0.004) {
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

const toast = useToast();
const { data: managers, isFetching, isError, error } = useFetchManagerNodes();
const queryClient = useQueryClient();

const batchingManager = computed(() => {
  if (!managers.value || managers.value.length === 0) {
    return null; // No managers available
  }

  // Find the first online manager
  return managers.value.find((manager) => manager.announcedAddresses) || null;
});
const { mutateAsync: mutateClaimPayments, isPending: isClaimingPayments } =
  useMutation({
    mutationFn: async () => {
      try {
        //establish a connection to the batching manager..
        if (!instance.value) {
          throw new Error("Worker instance is not available.");
        }

        if (!batchingManager.value) {
          throw new Error("No online manager found to claim payments.");
        }

        if (
          !managerPaymentBatches.value ||
          managerPaymentBatches.value.length === 0
        ) {
          throw new Error("No claimable payments found.");
        }

        //start the entity if not started
        if (instance.value.entity.node.status !== "started") {
          await instance.value.start();
        }

        await instance.value.entity.node.dial(
          multiaddr(batchingManager.value.announcedAddresses[0]),
        );

        for (const batch of managerPaymentBatches.value.filter(
          (x) => x.recipient === account.value,
        ) || []) {
          if (
            !batch.claimablePayments ||
            batch.claimablePayments.length === 0
          ) {
            continue; // Skip empty batches
          }

          await claimPayments({
            batchLength: batchLength.value,
            payments: batch.claimablePayments,
            managerPeerId: batchingManager.value.peerId,
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
