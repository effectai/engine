import { multiaddr, type Multiaddr } from "@effectai/protocol";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

export const useSession = () => {
  const sessionStore = useSessionStore();

  const { account } = useAuth();
  const { manager, isActive, status, uptimeSeconds } =
    storeToRefs(sessionStore);

  const { useGetNoncesAsyncQuery } = useNonce();
  const { useIdentifyAsyncQuery } = useIdentify();

  const managerInfo = computed(() => ({
    multiaddr: manager.value?.multiaddr,
    peerId: manager.value?.peerId,
    peerIdStr: manager.value?.peerId?.toString(),
    publicKey: manager.value?.publicKey,
    publicKeyStr: manager.value?.publicKey?.toString(),
  }));

  const connectToManagerMutation = useMutation({
    mutationFn: async ({
      multiAddress,
      accessCode,
    }: {
      multiAddress: string;
      accessCode?: string;
    }) => {
      const identify = await useIdentifyAsyncQuery(multiAddress);
      const peerId = multiaddr(multiAddress).getPeerId();
      assertExists(peerId, "Peer ID is not available");

      const nonces = await useGetNoncesAsyncQuery(
        identify.pubkey,
        peerId.toString(),
      );
      assertExists(nonces, "Nonces are not available");

      assertExists(account.value, "Account is not available");
      return sessionStore.establish(multiAddress, {
        recipient: account.value,
        currentNonce: nonces.nextNonce,
        accessCode,
      });
    },
    onError: (error) => {
      console.error(error);
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({
      //   queryKey: ["manager", "connection-status"],
      // });
    },
  });

  const disconnectFromManagerMutation = useMutation({
    mutationFn: async () => {
      return sessionStore.terminate();
    },
    onError: (error) => {
      console.error(error);
    },
    onSuccess: () => {
      console.log("Disconnected from manager successfully");
    },
  });

  return {
    connectToManagerMutation,
    disconnectFromManagerMutation,
    manager,
    managerInfo,
    isActive,
    status,
    uptimeSeconds,
  };
};
