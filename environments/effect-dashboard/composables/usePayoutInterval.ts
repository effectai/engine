import { useQuery } from "@tanstack/vue-query";

export const usePayout = () => {
  const config = useRuntimeConfig();

  const sessionStore = useSessionStore();
  const workerStore = useWorkerStore();

  const { instance } = storeToRefs(workerStore);
  const { manager } = storeToRefs(sessionStore);

  const intervalMs = Number.parseInt(config.public.PAYOUT_INTERVAL);

  const initialFetch = ref(false);

  onMounted(() => {
    setTimeout(() => {
      initialFetch.value = true;
    }, intervalMs);
  });

  const isReady = computed(
    () => !!instance.value && !!manager.value?.peerId && initialFetch.value,
  );

  return useQuery({
    queryKey: ["payout"],
    queryFn: async () => {
      if (!instance.value || !manager.value?.peerId) return;

      return await instance.value.requestPayout({
        managerPeerIdStr: manager.value.peerId,
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
