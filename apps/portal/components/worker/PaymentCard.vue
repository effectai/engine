<template>
  <UCard variant="mono" class="">
    <!-- Header -->
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <UIcon name="mdi:payment" />
          <h2 class="text-lg font-semibold">Settlements</h2>
        </div>
        <UButton @click="exportPrivateKey" icon="mdi-key" color="neutral">
          Export Private Key
        </UButton>
      </div>
    </template>

    <!-- Modal & Main Content -->
    <WorkerClaimPaymentsModal v-model="isOpenClaimModal" />
    <div class="p-4 space-y-4">
      <!-- Alerts & Wallet Info -->
      <div class="rounded-xl bg-gray-100 dark:bg-white/5 p-4">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >Blockchain:</span
            >
            <span class="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {{ walletMeta.chain }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >Address:</span
            >
            <BlockchainAddress class="text-sm" :address="account" />
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >{{ balance?.symbol }} Balance:</span
            >
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ (balance && formatNumber(balance.value)) || "-" }}
            </span>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >EFFECT Balance:</span
            >
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ (effectBalance && formatNumber(effectBalance.value)) || "-" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Payments List -->
      <div
        v-if="!managerPaymentBatches || managerPaymentBatches.length === 0"
        class="text-center py-4"
      >
        <p class="text-gray-500 dark:text-gray-400">No payments found.</p>
      </div>
      <div v-else>
        <!-- your payment batch list content -->
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="">
        <div
          class="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <img src="@/assets/img/effect-coin.jpg" class="w-10 rounded-full" />
          <div>
            <p class="text-2xl font-bold">
              {{ totalUnclaimedPayments }} EFFECT
            </p>
            <p class="text-xs text-gray-900 dark:text-gray-400">
              Total Unclaimed EFFECT
            </p>
            <UButton
              class="mt-2"
              color="neutral"
              @click="isOpenClaimModal = true"
            >
              Claim Payments
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
const { account } = useAuth();
const isOpenClaimModal = ref(false);

const walletMeta = {
  name: "Effect Node Wallet",
  icon: "mdi:wallet",
  chain: "solana",
  address: account.value,
};

const { useGetPaymentsQuery, computedTotalPaymentAmount } = usePayments();
const { data: managerPaymentBatches } = useGetPaymentsQuery();
const totalUnclaimedPayments = useNumberFormat(
  computedTotalPaymentAmount(managerPaymentBatches),
);

const toast = useToast();
const { requestPrivateKey } = useAuth();
const exportPrivateKey = async () => {
  const privateKey = await requestPrivateKey();
  if (privateKey) {
    navigator.clipboard
      .writeText(privateKey)
      .then(() => {
        toast.add({
          title: "Private Key Copied",
          description: "Your private key has been copied to the clipboard.",
        });
      })
      .catch((err) => {
        console.error("Failed to copy private key: ", err);
      });
  }
};

const { useGetBalanceQuery } = useSolanaWallet();
const { useGetEffectBalanceQuery } = useSolanaRpc();
const { data: balance } = useGetBalanceQuery(account);
const { data: effectBalance } = useGetEffectBalanceQuery(account);
//
// const totalUnclaimedEffectFormatted = computed(() => {
//   return formatNumber(Number((totalUnclaimedEffect.value || 0n) / BigInt(1e6)));
// });

const solanaBalanceLow = computed(() => {
  return balance.value && balance.value.value < 0.005;
});
</script>

<style scoped></style>
