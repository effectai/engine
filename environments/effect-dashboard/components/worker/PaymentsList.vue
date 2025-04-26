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
import { useWallet } from "solana-wallets-vue";
const { useGetPayments, useClaimPayments } = usePayments();
const { data: payments } = useGetPayments();
const { mutateAsync: claimPayments } = useClaimPayments();

function chunkArray(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size),
  );
}

const { fetchRemoteNonce } = usePaymentProgram();
const workerStore = useWorkerStore();
const { publicKey } = useWallet();
const { managerPublicKey, worker, managerPeerId } = storeToRefs(workerStore);

const useClaimPaymentsHandler = async () => {
  if (
    !payments.value ||
    payments.value.length === 0 ||
    !publicKey.value ||
    !managerPeerId.value ||
    !managerPublicKey.value
  ) {
    console.warn("No payments found, or not connected");
    return;
  }

  //get remote nonce
  const remoteNonce =
    (await fetchRemoteNonce(publicKey.value, managerPublicKey.value)) ?? 1n;
  const claimablePayments = await worker.value?.getPaymentsFromNonce({
    nonce: Number.parseInt(remoteNonce.toString()),
    peerId: managerPeerId.value.toString(),
  });

  //chunk into array's of 50
  const result = chunkArray(claimablePayments, 50);

  for (const paymentBatch of result) {
    const payments = paymentBatch.map((payment) => {
      return {
        nonce: payment.state.nonce,
        recipient: payment.state.recipient,
        amount: payment.state.amount,
        paymentAccount: payment.state.paymentAccount,
        signature: payment.state.signature,
      };
    });

    //claim payments
    await claimPayments({ payments });
  }
};
</script>

<style scoped></style>
