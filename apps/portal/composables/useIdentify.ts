import { multiaddr, type Multiaddr } from "@effectai/protocol";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

export const useIdentify = () => {
  const { instance } = storeToRefs(useWorkerStore());
  const { account } = useAuth();

  const queryClient = useQueryClient();

  const identifyQueryFn = (multiaddress: MaybeRef<string>) => {
    if (!multiaddress || !instance.value) {
      throw new Error("Multiaddress or worker instance is not available");
    }
    const multiaddrInstance = multiaddr(multiaddress as string);
    return instance.value?.identify(multiaddrInstance);
  };

  const identifyQuery = (
    multiaddress: MaybeRef<string>,
    account: Ref<string | null>,
  ) => ({
    queryKey: ["identify", multiaddress, account],
    queryFn: async () => identifyQueryFn(multiaddress),
    enabled: !!instance.value,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const useIdentifyQuery = (multiaddress: MaybeRef<string>) => {
    const isReady = computed(() => !!instance.value && !!multiaddress);

    return useQuery({
      ...identifyQuery(multiaddress, account),
      enabled: isReady.value,
    });
  };

  const useIdentifyAsyncQuery = async (multiaddress: string) => {
    if (!account.value) {
      throw new Error("Account is not available");
    }

    const data = await queryClient.ensureQueryData({
      ...identifyQuery(multiaddress, account),
    });

    return data;
  };

  return {
    useIdentifyQuery,
    useIdentifyAsyncQuery,
  };
};
