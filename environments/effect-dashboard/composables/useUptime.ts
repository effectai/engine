import { ref, computed, watch, onUnmounted } from "vue";

export function useUptime(startTimeRef: Ref<number | undefined>) {
  const now = ref(Date.now());
  let intervalId: number | null = null;

  const startTimer = () => {
    if (intervalId) return;
    intervalId = window.setInterval(() => {
      now.value = Date.now();
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const timeElapsed = computed(() => {
    if (!startTimeRef.value) return 0;
    return Math.max(0, now.value - startTimeRef.value * 1000);
  });

  const formattedTime = computed(() => {
    const totalSeconds = Math.floor(timeElapsed.value / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":");
  });

  watch(
    startTimeRef,
    (newVal) => {
      if (newVal !== undefined) {
        startTimer();
      } else {
        stopTimer();
      }
    },
    { immediate: true },
  );

  onUnmounted(stopTimer);

  return {
    formattedTime,
    timeElapsed: computed(() => timeElapsed.value / 1000), // in seconds
    isRunning: computed(() => startTimeRef.value !== undefined),
  };
}
