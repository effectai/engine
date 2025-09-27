<template>
  <UCard variant="outline" class="mb-4 overflow-hidden">
    <!-- Header -->
    <template #header>
      <div class="flex items-center justify-between gap-3 w-full">
        <div class="flex w-full items-center gap-2 justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="mdi:payment"
              class="h-6 w-6 text-gray-500 dark:text-gray-400"
            />
            <h2 class="text-lg font-semibold">Node Info</h2>
          </div>
          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-menu" color="neutral" variant="outline" />
          </UDropdownMenu>
        </div>
      </div>
    </template>

    <!-- Claim modal -->
    <ClaimPaymentsModal v-model="isOpenClaimModal" />

    <!-- Main content -->
    <div class="p-4 space-y-5 flex flex-col h-full">
      <!-- Wallet summary -->
      <div
        class="rounded-xl border-gray-200/70 dark:border-gray-800/60 bg-white/70 dark:bg-white/5"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >Peer ID</span
            >
            <div class="flex items-center gap-2">
              {{ sliceBoth(peerId.toString()) }}
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >Lifespan</span
            >
            <div class="flex items-center gap-2">{{ daysInNetwork }} days</div>
          </div>

          <!-- Chain -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >Blockchain</span
            >
            <div class="flex items-center gap-2">
              <UBadge
                size="xs"
                color="neutral"
                variant="subtle"
                class="capitalize"
              >
                {{ walletMeta?.chain || "—" }}
              </UBadge>
            </div>
          </div>

          <!-- Address -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >Address</span
            >
            <div class="flex items-center gap-2">
              <BlockchainAddress class="text-sm" :address="account" />
            </div>
          </div>

          <!-- Token balance -->
          <div class="flex items-center justify-between">
            <span
              class="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              {{ balance?.symbol || "Token" }} Balance
            </span>
            <span class="text-sm text-gray-900 dark:text-gray-300 font-medium">
              {{ balance ? formatNumber(balance.value) : "—" }}
            </span>
          </div>

          <!-- EFFECT balance -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >EFFECT Balance</span
            >
            <span class="text-sm text-gray-900 dark:text-gray-300 font-medium">
              {{ effectBalance ? formatNumber(effectBalance.value) : "—" }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between p-4">
        <span class="underline"
          >You have {{ totalUnclaimedPayments }} EFFECT claimable</span
        >
        <UButton
          @click="isOpenClaimModal = true"
          :disabled="!totalUnclaimedPayments || totalUnclaimedPayments === '0'"
          class="text-xs text-black"
        >
          <UIcon name="mdi:cash" class="w-4 h-4 mr-1" />
          Claim Payments</UButton
        >
      </div>
    </template>
  </UCard>
</template>
<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
const { account } = useAuth();
const isOpenClaimModal = ref(false);
const { peerId, daysInNetwork } = useWorkerNode();

const walletMeta = {
  name: "Effect Node Wallet",
  icon: "mdi:wallet",
  chain: "solana",
  address: account.value,
};

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

const items: DropdownMenuItem[] = [
  {
    label: "Export Private Key",
    icon: "material-symbols:key",
    onSelect: exportPrivateKey,
  },
];

const { useGetPaymentsQuery, computedTotalPaymentAmount } = usePayments();
const { useGetBalanceQuery } = useSolanaWallet();
const { useGetEffectBalanceQuery } = useSolanaWallet();
const { data: balance } = useGetBalanceQuery(account);
const { data: effectBalance } = useGetEffectBalanceQuery(account);
const { data: managerPaymentBatches } = useGetPaymentsQuery();

const totalUnclaimedPayments = useNumberFormat(
  computedTotalPaymentAmount(managerPaymentBatches),
);

function formatNumber(v?: number) {
  if (v == null) return "—";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(v);
}
</script>

<style scoped></style>
