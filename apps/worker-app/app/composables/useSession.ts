import { type Multiaddr, multiaddr } from "@effectai/protocol-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

export const useSession = () => {
  const sessionStore = useSessionStore();

  const { account } = useAuth();
  const { manager, isActive, status, uptimeSeconds } =
    storeToRefs(sessionStore);

  const { useGetNoncesAsyncQuery } = useNonce();
  const { useIdentifyAsyncQuery } = useIdentify();
  const { registerDevice } = useDeviceRegistration();
  const { syncPayments } = usePaymentSync();
  const { isEnabled } = useFeatureFlags();

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
      const result = await sessionStore.establish(multiAddress, {
        recipient: account.value,
        currentNonce: nonces.nextNonce,
        accessCode,
      });

      // Register this device in the manager's storage layer
      try {
        if (isEnabled("device-storage")) {
          await registerDevice(multiaddr(multiAddress));
        }
        if (isEnabled("payment-storage")) {
          await syncPayments(multiaddr(multiAddress), nonces);
        }
      } catch {
        // Registration failed — roll back the connection
        await sessionStore.terminate();
        throw new Error("We failed to register your device. Please try again.");
      }

      return result;
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
