import type { ManagerInfoResponse } from "@effectai/protocol";
import { type Multiaddr, multiaddr } from "@effectai/protocol-core";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/vue-query";

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

          const identify = await workerStore.worker?.identify(
            multiaddr(data.value.announcedAddresses[0]),
          );

          const latency = await workerStore.worker?.ping(
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
