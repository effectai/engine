<template>
  <UCard class="bg-zinc-800 text-white">
    <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
      <UIcon name="i-lucide-dollar-sign" size="24" class="text-emerald-400" />
      PAYMENTS
    </h2>
    <UTable
      :loading="paymentStore === null"
      :rows="paymentStore"
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
        { sortable: true, key: 'nonce', label: 'Nonce' },
        { key: 'recipient', label: 'Recipient' },
        { key: 'paymentAccount', label: 'payment Account' },
        { key: 'amount', label: 'Amount' },
      ]"
    >
      <template #amount-data="{ row }">
        <span>{{ formatBigIntToAmount(row.amount) }}</span>
      </template>
      <template #recipient-data="{ row }">
        <span>{{ trimAddress(row.recipient) }}</span>
      </template>
      <template #paymentAccount-data="{ row }">
        <span>{{ trimAddress(row.paymentAccount) }}</span>
      </template>
    </UTable>
  </UCard>
</template>

<script setup lang="ts">
const { paymentStore } = useWorkerNode();
</script>

<style scoped></style>
