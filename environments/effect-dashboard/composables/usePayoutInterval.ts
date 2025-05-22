import { useQuery } from "@tanstack/vue-query";

export const usePayout = () => {
  const sessionStore = useSessionStore();
  const config = useRuntimeConfig();
  const workerStore = useWorkerStore();
  const { worker } = storeToRefs(workerStore);

  const { managerPeerId } = storeToRefs(sessionStore);
  const isReady = computed(() => !!worker.value && !!managerPeerId.value);

  return useQuery({
    queryKey: ["payout"],
    queryFn: async () => {
      if (!worker.value || !managerPeerId.value) return;

      return await worker.value.requestPayout({
        managerPeerIdStr: managerPeerId.value,
      });
    },
    refetchOnMount: false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    enabled: isReady,
    refetchInterval: Number.parseInt(config.public.PAYOUT_INTERVAL),
  });
};
