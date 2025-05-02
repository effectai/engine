<template>
  <UCard class="">
    <WorkerClaimPaymentsModal v-model="isOpenClaimModal" />
    <div class="justify-between text-lg font-bold mb-4 flex items-center gap-2">
      <h2 class="flex items-center">
        <UIcon name="i-lucide-dollar-sign" size="24" class="text-emerald-400" />
        PAYMENTS
      </h2>
      <UButton
        v-if="payments && payments.length > 0"
        color="black"
        @click="isOpenClaimModal = true"
        >Claim</UButton
      >
    </div>
    <UTable
      v-if="isSuccess"
      :loading="payments === null"
      :rows="mutatedPayments"
      :loading-state="{
        icon: 'i-heroicons-arrow-path-20-solid',
        label: 'Waiting for tasks...',
      }"
      :ui="{
        table: 'table',
        thead: 'text-zinc-400 uppercase',
        td: {
          base: 'font-mono',
        },
        th: {
          base: 'text-zinc-400 uppercase font-mono',
        },
        tbody:
          'divide-y divide-(--ui-border) [&>tr]:data-[selectable=true]:hover:bg-(--ui-bg-elevated)/50 [&>tr]:data-[selectable=true]:focus-visible:outline-(--ui-primary)',
        tr: {
          base: 'border-b border-zinc-700/50 hover:bg-zinc-700/20 transition-colors',
        },
      }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      class="w-full"
      :columns="[
        { sortable: true, key: 'state.nonce', label: 'Nonce', sort: sortNonce },
        { key: 'state.label', label: 'label' },
        { key: 'claimed', label: 'status', sortable: true },
        { key: 'recipient', label: 'Recipient' },
        { key: 'amount', label: 'Amount' },
      ]"
    >
      <template #amount-data="{ row }">
        <span>{{ formatBigIntToAmount(row.state.amount) }}</span>
      </template>

      <template #claimed-data="{ row }">
        <span v-if="nonces">
          <UBadge :color="row.claimed ? 'green' : 'yellow'">
            <span v-if="row.claimed"> Claimed </span>
            <span v-else> Claimable </span>
          </UBadge>
        </span>
      </template>
      <template #recipient-data="{ row }">
        <span>{{ sliceBoth(row.state.recipient) }}</span>
      </template>
      <template #paymentAccount-data="{ row }">
        <span>{{ sliceBoth(row.state.paymentAccount) }}</span>
      </template>
    </UTable>
  </UCard>
</template>

<script setup lang="ts">
const { useGetPayments, useClaimPayments } = usePayments();
const { data: payments } = useGetPayments();
const sessionStore = useSessionStore();
const { useGetNonce } = sessionStore.useActiveSession();
const { data: nonces, isSuccess } = useGetNonce();

const isOpenClaimModal = ref(false);

const mutatedPayments = computed(
  () =>
    payments.value?.map(
      (p) =>
        (nonces.value && {
          ...p,
          claimed: nonces.value.remoteNonce ?? 0n >= p.state.nonce,
        }) ||
        [],
    ) || [],
);

const sortNonce = (a: bigint, b: bigint) => {
  if (a > b) {
    return 1;
  }

  if (b > a) {
    return -1;
  }

  return 0;
};
</script>

<style scoped></style>
