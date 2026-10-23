import { useQuery } from "@tanstack/vue-query";
import { watchDebounced } from "@vueuse/core";

export const usePayout = () => {
  const config = useRuntimeConfig();

  const sessionStore = useSessionStore();
  const workerStore = useWorkerStore();

  const { instance } = storeToRefs(workerStore);
  const { manager } = storeToRefs(sessionStore);
  const { account } = useAuth();
  const { useGetNoncesAsyncQuery } = useNonce();
  const { syncPayments } = usePaymentSync();

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

  const { data } = useQuery({
    queryKey: ["payout"],
    queryFn: async () => {
      if (!instance.value || !manager.value?.peerId) return;

      return await instance.value.requestPayout({
        managerPeerIdStr: manager.value.peerId.toString(),
      });
    },
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: intervalMs,
    refetchIntervalInBackground: true,
    enabled: isReady,
  });

  // Sync payments to remote storage after each successful payout.
  // This is called when passive payout is called (data) changes with
  // a 5 second cooldown.
  watchDebounced(
    [data, manager, account],
    async () => {
      if (!data.value || !manager.value || !account.value) return;

      const multiaddr = manager.value.multiaddr;
      const peerId = manager.value.peerId?.toString();
      const pubKey = manager.value.publicKey?.toString();
      if (!multiaddr || !peerId || !pubKey || !account.value) return;

      try {
        const nonces = await useGetNoncesAsyncQuery(pubKey, peerId, account.value);
        await syncPayments(multiaddr, nonces);
      } catch (error) {
        console.error("[PayoutSync] Failed to sync payments after payout:", error);
      }
    },
    { debounce: 5000 },
  );

  return { data };
};
