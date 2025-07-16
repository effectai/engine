import { multiaddr, type Multiaddr } from "@effectai/protocol";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

async function waitFor(condition: () => boolean, timeout = 5000) {
  const interval = 50;
  let waited = 0;
  while (!condition() && waited < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    waited += interval;
  }
  if (!condition()) throw new Error("Timed out waiting for condition");
}

export const useSession = () => {
  const sessionStore = useSessionStore();

  const { manager, isActive, status, uptimeSeconds } =
    storeToRefs(sessionStore);

  const managerMultiaddr = computed(() => manager.value?.multiaddr);
  const managerPeerId = computed(() => manager.value?.peerId);
  const managerPeerIdStr = computed(() => manager.value?.peerId?.toString());

  const managerPublicKey = computed(() => manager.value?.publicKey);
  const managerPublicKeyStr = computed(() =>
    manager.value?.publicKey?.toString(),
  );
  const { useGetNoncesAsyncQuery } = useNonce();
  const { useIdentifyAsyncQuery } = useIdentify();

  const connectToManagerMutation = useMutation({
    mutationFn: async ({
      multiAddress,
    }: {
      multiAddress: string;
    }) => {
      const identify = await useIdentifyAsyncQuery(multiAddress);
      const peerId = ref(multiaddr(multiAddress).getPeerId());
      if (!peerId.value) {
        throw new Error("Peer ID is not available in the multiaddress");
      }

      const nonces = await useGetNoncesAsyncQuery(
        identify.pubkey,
        peerId.value.toString(),
      );
      console.log("done", nonces);

      return sessionStore.establish(multiAddress, {
        recipient: identify.account,
        currentNonce: nonces.nextNonce,
      });
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({
      //   queryKey: ["manager", "connection-status"],
      // });
    },
  });

  return {
    connectToManagerMutation,
    manager,
    isActive,
    status,
    managerMultiaddr,
    managerPeerId,
    managerPeerIdStr,
    managerPublicKey,
    managerPublicKeyStr,
    uptimeSeconds,
  };
};
