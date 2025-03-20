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
        <div class="flex flex-col"></div>
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

const totalUptime = useUptime(props.totalUptimeInSeconds);

const baseEffectEarned = computed(() => {
	return totalUptime.totalTimeInSeconds.value * 0.2;
});
</script>

<style lang="scss" scoped></style>
