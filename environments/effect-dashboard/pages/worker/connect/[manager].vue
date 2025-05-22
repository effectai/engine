<template>
  <WorkerNodeStatusCard class="my-5" />
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
    />
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
  <WorkerPaymentsList />
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "worker",
  middleware: ["auth", "session"],
});

const config = useRuntimeConfig();

const { useActiveSession } = useSessionStore();
const { connectedOn } = useActiveSession();

const uptime = useUptime(connectedOn);

const { useGetPayments } = usePayments();
const { data: payments } = useGetPayments();

const { useGetTasks } = useTasks();
const { data: completedTasks } = useGetTasks(ref("completed"));
const { data: rejectedTasks } = useGetTasks(ref("rejected"));
const { data: expiredTasks } = useGetTasks(ref("expired"));

const { data: _payout } = usePayout();
const { data: identify } = useIdentify();
watch(
  () => identify.value?.isConnected,
  (isConnected) => {
    if (isConnected === false) {
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
  if (!payments.value) {
    return formatNumber(0);
  }

  const total = payments.value.reduce((acc, payment) => {
    return acc + payment.state.amount;
  }, 0n);

  return `${formatBigIntToAmount(total).toFixed(2)} EFFECT`;
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
