<template>
  <UCard>
    <h2 class="title text-2xl">Total Uptime</h2>
    <span class="text-slate-400"
      >The total time the worker has been online.</span
    >
    <div class="flex justify-center items-center my-4">
      <div class="text-4xl flex justify-center items-center gap-2">
        <UIcon name="lucide:clock" />
        <span>{{ totalUptime.formattedTime }}</span>
      </div>
    </div>

    <div class="flex justify-between gap-2 mt-3">
      <div>
        <div class="flex flex-col">
          <UButton color="black" @click="requestPayoutHandler"
            >Claim Payout</UButton
          >
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  const props = defineProps<{
    totalUptimeInSeconds: number;
    totalManagerUptimeInSeconds: number;
    lastPing: number;
  }>();

  const { requestPayout } = usePayments();
  const { managerPeerId } = useWorkerNode();
  const totalUptime = useUptime(props.totalUptimeInSeconds);

  const toast = useToast();

  const requestPayoutHandler = async () => {
    try {
      if (!managerPeerId.value) {
        console.error("Manager peer id not found");
        return;
      }

      const payment = await requestPayout(managerPeerId.value);

      toast.add({
        title: "Paid out",
        description: `Succesfully paid out ${formatBigIntToAmount(
          payment.amount
        )} EFFECT`,
      });
    } catch (e) {
      console.error(e);
    }
  };
</script>

<style lang="scss" scoped></style>
