<template>
  <WorkerNodeStatusCard class="my-5" />
  <WorkerClaimPaymentsModal v-model="isOpenClaimModal" />
  <WorkerTaskModal />
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-5">
    <WorkerStatisticCard
      icon="i-lucide-cpu"
      label="Time Online"
      :value="uptime.formattedTime"
    >
      <small class="text-xs font-mono text-emerald-500"
        >payout every
        {{ Number.parseInt(config.public.PAYOUT_INTERVAL) / 1000 / 60 }}
        minutes</small
      >
    </WorkerStatisticCard>
    <WorkerStatisticCard
      icon="i-lucide-dollar-sign"
      label="Total Earned"
      :value="totalEarned"
    >
      <a href="#" @click="isOpenClaimModal = true" class="underline"
        >claim payments</a
      >
    </WorkerStatisticCard>
    <WorkerStatisticCard
      icon="i-lucide-activity"
      label="Tasks Completed"
      :value="totalCompletedTasks"
    />
    <WorkerStatisticCard
      icon="i-material-symbols-score-sharp"
      label="Performance"
      :value="performanceScore"
    >
    </WorkerStatisticCard>
  </div>
  <WorkerTaskList class="my-5" />
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "worker",
  middleware: ["auth", "session"],
});

const config = useRuntimeConfig();
const isOpenClaimModal = ref(false);

const { useActiveSession } = useSessionStore();
const { connectedOn } = useActiveSession();

const uptime = useUptime(connectedOn);

const { useGetTotalAmountFromPayments } = usePayments();
const { data: totalPaymentAmount } = useGetTotalAmountFromPayments();

const { useGetTasks } = useTasks();
const { data: completedTasks } = useGetTasks(ref("completed"));
const { data: rejectedTasks } = useGetTasks(ref("rejected"));

const { data: expiredTasks } = useGetTasks(ref("expired"));

const { data: _payout } = usePayout();
const { data: identify } = useIdentify();

watch(
  () => identify.value?.isConnected,
  (isConnected, oldValue) => {
    if (isConnected === false && oldValue === true) {
      navigateTo("/worker/connect");
    }
  },
  { immediate: true },
);

const performanceScore = computed(() => {
  if (!completedTasks.value || !rejectedTasks.value || !expiredTasks.value) {
    return formatNumber(0);
  }

  const totalTasks =
    completedTasks.value.length +
    rejectedTasks.value.length +
    expiredTasks.value.length;

  if (totalTasks === 0) {
    return formatNumber(0);
  }

  const performance =
    (rejectedTasks.value.length + expiredTasks.value.length) / totalTasks;

  return `${(100 - formatNumber(performance * 100)).toFixed(2)} %`;
});

const totalEarned = computed(() => {
  if (!totalPaymentAmount.value) {
    return formatNumber(0);
  }

  // return `${formatBigIntToAmount(totalPaymentAmount.value).toFixed(2)} EFFECT`;
  const formattedTotal = formatBigIntToAmount(totalPaymentAmount.value).toFixed(2)
  return `${Number(formattedTotal).toLocaleString()} EFFECT`;
});

const totalCompletedTasks = computed(() => {
  if (!completedTasks.value) {
    return formatNumber(0);
  }

  return completedTasks.value.length;
});

const { useDisconnect } = useSession();
const { mutateAsync: disconnect } = useDisconnect();
tryOnBeforeUnmount(async () => {
  await disconnect();
});
</script>
