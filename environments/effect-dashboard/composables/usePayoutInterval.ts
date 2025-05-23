import { useQuery } from "@tanstack/vue-query";

export const usePayout = () => {
  const sessionStore = useSessionStore();
  const config = useRuntimeConfig();
  const workerStore = useWorkerStore();
  const { worker } = storeToRefs(workerStore);

  const { managerPeerId } = storeToRefs(sessionStore);
  const intervalMs = Number.parseInt(config.public.PAYOUT_INTERVAL);

  const initialFetch = ref(false);

  onMounted(() => {
    setTimeout(() => {
      initialFetch.value = true;
    }, intervalMs);
  });

  const isReady = computed(
    () => !!worker.value && !!managerPeerId.value && initialFetch.value,
  );

  return useQuery({
    queryKey: ["payout"],
    queryFn: async () => {
      if (!worker.value || !managerPeerId.value) return;

      return await worker.value.requestPayout({
        managerPeerIdStr: managerPeerId.value,
      });
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
    enabled: isReady,
  });
};
