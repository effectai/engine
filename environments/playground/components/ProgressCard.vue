<template>
  <div>
    <UCard>
      <h2 class="title text-2xl">Total Earned</h2>
      <span class="text-slate-400"
        >Total EFFECT you've earned this session.</span
      >
      <div class="flex justify-center items-center my-4">
        <div class="text-3xl flex justify-center items-center gap-2">
          <img class="rounded-xl" src="public/effect-icon.png" />
          <span>{{ claimableAmount }} <span class="text-xl">EFFECT</span></span>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { paymentStore, claimableAmount } = await useWorkerNode();

const props = defineProps<{
	totalUptimeInSeconds: number;
}>();

const totalUptime = useUptime(props.totalUptimeInSeconds);
</script>

<style scoped></style>
