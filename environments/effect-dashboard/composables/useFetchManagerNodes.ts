import { PublicKey } from "@solana/web3.js";
import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { useQuery } from "@tanstack/vue-query";
import type { ManagerInfoResponse } from "@effectai/protocol";

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

          const latency = await workerStore.ping(
            multiaddr(data.value.announcedAddresses[0]),
          );

          return {
            ...data.value,
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
