<template>
  <UCard class="">
    <div class="justify-between text-lg font-bold mb-4 flex items-center gap-2">
      <h2 class="flex items-center">
        <UIcon name="i-lucide-dollar-sign" size="24" class="text-emerald-400" />
        PAYMENTS
      </h2>
      <UButton :loading="isPending" color="black" @click="mutateClaimPayments"
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
import { useMutation } from "@tanstack/vue-query";
import type { PaymentRecord } from "@effectai/protocol";

const { useGetPayments, useClaimPayments } = usePayments();
const { data: payments } = useGetPayments();
const { mutateAsync: claimPayments } = useClaimPayments();
const sessionStore = useSessionStore();
const { useGetNonce } = sessionStore.useActiveSession();
const { data: nonces, isSuccess } = useGetNonce();

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

const { mutateAsync: mutateClaimPayments, isPending } = useMutation({
  mutationFn: async () => {
    const { useActiveSession } = useSessionStore();
    const { account, managerPublicKey, managerPeerId } = useActiveSession();
    const workerStore = useWorkerStore();
    const { worker } = storeToRefs(workerStore);

    if (!account.value || !managerPublicKey.value || !managerPeerId.value) {
      console.error("No account or manager found");
      return;
    }

    if (!nonces.value) {
      console.error("No nonces found");
      return;
    }

    let nonce = 0;
    if (nonces.value.remoteNonce === null) {
      nonce = 1;
    } else {
      nonce = Number.parseInt(nonces.value.remoteNonce.toString()) + 1;
    }

    const claimablePayments = await worker.value?.getPaymentsFromNonce({
      nonce,
      peerId: managerPeerId.value.toString(),
    });

    const sortedPayments = claimablePayments?.toSorted((a, b) => {
      return a.state.nonce > b.state.nonce ? 1 : -1;
    });

    const result = chunkArray(sortedPayments, 60);
    for (const paymentBatch of result) {
      const payments = paymentBatch.map((payment: PaymentRecord) => {
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
  },
});
</script>

<style scoped></style>
