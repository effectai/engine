<template>
  <UCard
    class="mb-4 p-0 overflow-y-scroll rounded-xlll text-black dark:text-white relative"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <UIcon name="mdi:payment" />
          <h2 class="text-lg font-semibold">Settlements</h2>
        </div>
        <div class="flex flex-end justify-end">
          <UButton icon="mdi-key" class="" color="neutral"
            >Export Private Key</UButton
          >
        </div>
      </div>
    </template>

    <WorkerClaimPaymentsModal
      :managerPaymentBatches="managerPaymentBatches"
      v-model="isOpenClaimModal"
    />
    <UCard variant="mono">
      <div class="">
        <UCard>
          <template #header>
            <div>
              <UAlert
                v-if="solanaBalanceLow"
                icon="i-heroicons-information-circle"
                color="neutral"
                title="Low SOL Balance"
                description="Your SOL balance is low. Please ensure you have enough SOL to cover transaction fees."
                class="mb-4 rounded-lg"
              >
              </UAlert>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >Blockchain:</span
                >
                <span
                  class="text-sm text-gray-600 dark:text-gray-400 capitalize"
                >
                  {{ walletMeta.chain }}</span
                >
              </div>

              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >Address:</span
                >
                <BlockchainAddress class="text-sm" :address="account" />
              </div>
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >{{ balance?.symbol }} Balance:</span
                >
                <span class="text-sm text-gray-600 dark:text-gray-400">{{
                  (balance && formatNumber(balance.value)) || "-"
                }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >EFFECT Balance:</span
                >
                <span class="text-sm text-gray-600 dark:text-gray-400">{{
                  (effectBalance && formatNumber(effectBalance.value)) || "-"
                }}</span>
              </div>
            </div>
          </template>
        </UCard>
        <div
          v-if="paymentManagerRecords && paymentManagerRecords.length === 0"
          class="p-4 text-center"
        >
          <p class="text-gray-500">No payments found.</p>
        </div>
        <div v-else></div>
      </div>
    </UCard>
    <template #footer>
      <div
        class="text-center p-4 bg-white/10 bg-opacity-10 rounded-lg backdrop-blur-sm"
      >
        <div class="flex gap-4 items-center justify-center">
          <img src="@/assets/img/effect-coin.jpg" class="w-10 rounded-full" />
          <div>
            <p class="text-2xl font-bold">
              {{ totalUnclaimedEffectFormatted }} EFFECT
            </p>
            <p class="text-xs">Total Unclaimed EFFECT</p>
            <UButton
              class="mt-2"
              color="neutral"
              @click="isOpenClaimModal = true"
              >Claim Payments</UButton
            >
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
const { getAllManagersFromPayments } = usePayments();
const managerPaymentBatches = await getAllManagersFromPayments();
const { account } = useAuth();
const isOpenClaimModal = ref(false);

const walletMeta = {
  name: "Effect Node Wallet",
  icon: "mdi:wallet",
  chain: "solana",
  address: account.value,
};

const { useGetBalanceQuery } = useSolanaWallet();
const { useGetEffectBalanceQuery } = useSolanaRpc();
const { data: balance } = useGetBalanceQuery(account);
const { data: effectBalance } = useGetEffectBalanceQuery(account);

const totalUnclaimedEffect = computed(() => {
  return managerPaymentBatches.reduce((total, record) => {
    const claimableAmount = record.claimablePayments.reduce((sum, payment) => {
      return sum + (payment.state.amount || 0n);
    }, 0n);
    return total + claimableAmount;
  }, 0n);
});

const totalUnclaimedEffectFormatted = computed(() => {
  return formatNumber(Number(totalUnclaimedEffect.value / BigInt(1e6)));
});

const solanaBalanceLow = computed(() => {
  return balance.value && balance.value.value < 0.005;
});
</script>

<style scoped></style>
