import { multiaddr } from "@effectai/protocol";
import { useQuery } from "@tanstack/vue-query";
export const useIdentify = () => {
  const sessionStore = useSessionStore();

  const workerStore = useWorkerStore();
  const { worker } = storeToRefs(workerStore);
  const { account } = storeToRefs(sessionStore);

  const { managerMultiAddress } = storeToRefs(sessionStore);
  const isReady = computed(() => !!worker.value && !!managerMultiAddress.value);

  return useQuery({
    queryKey: ["identify", account],
    queryFn: async () => {
      if (!worker.value || !managerMultiAddress.value) return;

      return await worker.value.identify(multiaddr(managerMultiAddress.value));
    },
    enabled: isReady,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
};
