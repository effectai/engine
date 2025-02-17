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
          <label class="text-sm">Base earned: </label>
          <span v-if="totalUptime.totalTimeInSeconds"
            >{{ baseEffectEarned.toFixed(2) }} EFFECT</span
          >
        </div>
      </div>
      <div>
        <div class="flex flex-col">
          <label class="text-sm">Last Healthcheck: </label
          >{{ totalManagerUptime.formattedTime }}
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

const totalUptime = useUptime(props.totalUptimeInSeconds);
const totalManagerUptime = useUptime(props.totalManagerUptimeInSeconds);

function useUptime(initialTime: number) {
	const totalTimeInSeconds = ref(initialTime);

	const formattedTime = computed(() => {
		const seconds = totalTimeInSeconds.value;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		return `${hours}h ${minutes}m ${remainingSeconds}s`;
	});

	let interval: ReturnType<typeof setInterval> | null = null;

	onMounted(() => {
		interval = setInterval(() => {
			totalTimeInSeconds.value += 1;
		}, 1000);
	});

	onUnmounted(() => {
		if (interval) clearInterval(interval);
	});

	return { totalTimeInSeconds, formattedTime };
}

const baseEffectEarned = computed(() => {
	return totalUptime.totalTimeInSeconds.value * 0.2;
});

const totalTime = computed(() => {
	const seconds = totalTimeInSeconds.value;
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;

	return `${hours}h ${minutes}m ${remainingSeconds}s`;
});

let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
	interval = setInterval(() => {
		totalTimeInSeconds.value += 1;
	}, 1000);
});
</script>

<style lang="scss" scoped></style>
