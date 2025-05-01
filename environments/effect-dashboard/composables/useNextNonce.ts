import { useQuery } from "@tanstack/vue-query";

export const useNextNonce = (
  managerPublicKey: Ref<string | undefined>,
  managerPeerIdStr: Ref<string | undefined>,
) => {
  const { worker } = storeToRefs(useWorkerStore());
  const { useRecipientManagerDataAccount } = usePaymentProgram();
  const { account } = useWeb3Auth();

  const {
    data: recipientManagerDataAccount,
    isLoading: isRemoteLoading,
    error: remoteError,
  } = useRecipientManagerDataAccount(account, managerPublicKey);

  return useQuery({
    enabled: computed(
      () =>
        recipientManagerDataAccount.value !== undefined &&
        !!worker.value &&
        !!managerPeerIdStr.value,
    ),
    queryKey: computed(() => [
      "nextNonce",
      account.value,
      managerPublicKey.value,
    ]),
    queryFn: async () => {
      if (!worker.value || !managerPeerIdStr.value) {
        throw new Error("Worker or manager peer ID missing");
      }

      const remoteNonce = recipientManagerDataAccount.value?.nonce ?? null;

      const maxLocalNonce =
        (await worker.value.getMaxNonce({
          managerPeerIdStr: managerPeerIdStr.value,
        })) ?? 0;

      const remoteBigInt = remoteNonce !== null ? BigInt(remoteNonce) : 0n;
      const localBigInt = BigInt(maxLocalNonce);
      const nextNonce =
        (remoteBigInt > localBigInt ? remoteBigInt : localBigInt) + 1n;

      return {
        nextNonce,
        remoteNonce,
        localNonce: maxLocalNonce,
      };
    },
  });
};
