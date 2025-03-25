export function useUptime() {
	const startTime = ref(Math.floor(Date.now() / 1000)); // Current Unix timestamp in seconds
	const elapsedTime = ref(0);

	let interval: ReturnType<typeof setInterval> | null = null;

	const formattedTime = computed(() => {
		const seconds = elapsedTime.value;
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = seconds % 60;

		return `${hours}h ${minutes}m ${remainingSeconds}s`;
	});

	onMounted(() => {
		elapsedTime.value = Math.floor(Date.now() / 1000) - startTime.value;

		interval = setInterval(() => {
			elapsedTime.value = Math.floor(Date.now() / 1000) - startTime.value;
		}, 1000);
	});

	onUnmounted(() => {
		if (interval) clearInterval(interval);
	});

	return { startTime, elapsedTime, formattedTime };
}
