<template>
  <UCard class="">
    <div class="justify-between text-lg font-bold mb-4 flex items-center gap-2">
      <h2 class="flex items-center">
        <UIcon name="i-lucide-dollar-sign" size="24" class="text-emerald-400" />
        PAYMENTS
      </h2>
      <UButton color="black" @click="useClaimPaymentsHandler">Claim</UButton>
    </div>
    <UTable
      :loading="payments === null"
      :rows="payments"
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
        { sortable: true, key: 'state.nonce', label: 'Nonce' },
        { key: 'state.label', label: 'label' },
        { key: 'status', label: 'status' },
        { key: 'recipient', label: 'Recipient' },
        { key: 'amount', label: 'Amount' },
      ]"
    >
      <template #amount-data="{ row }">
        <span>{{ formatBigIntToAmount(row.state.amount) }}</span>
      </template>

      <template #status-data="{ row }">
        <span>
          <UBadge :color="remoteNonce > row.state.nonce ? 'green' : 'yellow'">
            <span v-if="remoteNonce > row.state.nonce"> Claimed </span>
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

const { mutateAsync: claimPayments } = useClaimPayments();

const useClaimPaymentsHandler = async () => {
  if (!payments.value) {
    return;
  }

  const claimablePayments = payments.value.map((r) => r.state);

  claimablePayments.sort((a, b) => {
    if (a.nonce < b.nonce) {
      return -1;
    }
    if (a.nonce > b.nonce) {
      return 1;
    }
    return 0;
  });

  await claimPayments({ payments: claimablePayments });
};
</script>

<style scoped></style>
