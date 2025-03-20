export function useUptime(initialTime: number) {
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
