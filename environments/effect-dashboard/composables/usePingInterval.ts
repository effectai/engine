import { multiaddr } from "@effectai/protocol";
import { useQuery } from "@tanstack/vue-query";

export const usePing = () => {
  const sessionStore = useSessionStore();
  const { managerMultiAddress } = storeToRefs(sessionStore);

  const workerStore = useWorkerStore();
  const { worker } = storeToRefs(workerStore);

  const isReady = computed(() => !!worker.value && !!managerMultiAddress.value);

  return useQuery({
    queryKey: ["ping"],
    queryFn: async () => {
      if (!worker.value || !managerMultiAddress.value) return;
      return await worker.value.ping(multiaddr(managerMultiAddress.value));
    },
    enabled: isReady,
    refetchInterval: 5000,
  });
};
