import { useQuery } from "@tanstack/vue-query";

export const usePayout = () => {
  const sessionStore = useSessionStore();
  const config = useRuntimeConfig();
  const workerStore = useWorkerStore();
  const { worker } = storeToRefs(workerStore);

  const { managerPeerId } = storeToRefs(sessionStore);

  const lastRunTimestamp = ref<number>(Date.now());
  const intervalMs = Number.parseInt(config.public.PAYOUT_INTERVAL);

  const isReady = computed(() => !!worker.value && !!managerPeerId.value);

  return useQuery({
    queryKey: ["payout"],
    queryFn: async () => {
      const now = Date.now();
      if (!worker.value || !managerPeerId.value) return;

      if (now - lastRunTimestamp.value < intervalMs) {
        console.log("Payout interval not reached");
        return;
      }

      return await worker.value.requestPayout({
        managerPeerIdStr: managerPeerId.value,
      });
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: Number.parseInt(config.public.PAYOUT_INTERVAL),
    refetchIntervalInBackground: true,
    enabled: isReady,
  });
};
