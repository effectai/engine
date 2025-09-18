import { type Multiaddr, multiaddr } from "@effectai/protocol-core";
import { useQuery } from "@tanstack/vue-query";

type ManagerInfoResponse = {
  id: string;
  addresses: Multiaddr[];
  announcedAddresses: string[];
  protocols: string[];
  agentVersion: string;
  publicKey: string;
  latency?: number;
};

export const useFetchManagerNodes = () => {
  const config = useRuntimeConfig();
  const workerStore = useWorkerStore();
  const query = useQuery({
    queryKey: ["managers"],
    queryFn: async () => {
      const managers = config.public.EFFECT_MANAGERS;

      const results = await Promise.all(
        managers.map(async (manager) => {
          const { data } = await useFetch<ManagerInfoResponse>(manager);

          if (!data.value) {
            return null;
          }

          const identify = await workerStore.instance?.identify(
            multiaddr(data.value.announcedAddresses[0]),
          );

          const latency = await workerStore.instance?.ping(
            multiaddr(data.value.announcedAddresses[0]),
          );

          return {
            ...data.value,
            ...identify,
            latency,
          };
        }),
      );

      return results.filter(
        (result) => result !== null,
      ) as ManagerInfoResponse[];
    },
  });

  return query;
};
