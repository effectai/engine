import { multiaddr } from "@effectai/protocol-core";
import { useQuery } from "@tanstack/vue-query";

export const usePing = () => {
  const { manager } = useSession();
  const { instance: worker } = storeToRefs(useWorkerStore());

  const isReady = computed(() => !!worker.value && !!manager.value?.multiaddr);

  return useQuery({
    queryKey: ["ping"],
    queryFn: async () => {
      if (!worker.value || !manager.value?.multiaddr) return;
      return await worker.value.ping(multiaddr(manager.value.multiaddr));
    },
    enabled: isReady,
    refetchOnWindowFocus: false,

    //never refetch
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
};
