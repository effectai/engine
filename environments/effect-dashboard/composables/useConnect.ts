import { multiaddr } from "@effectai/protocol";
import { useMutation } from "@tanstack/vue-query";

export const useConnect = () => {
  const sessionStore = useSessionStore();
  const { account } = useAuth();
  const { useGetNoncesAsyncQuery } = useNonce();
  const { useIdentifyAsyncQuery } = useIdentify();

  const connectToManagerMutation = useMutation({
    mutationFn: async ({
      multiAddress,
    }: {
      multiAddress: string;
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
};
