import type { PublicKey } from "@solana/web3.js";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

export const useNonce = () => {
  const queryClient = useQueryClient();
  const { getRecipientManagerDataAccount } = usePaymentProgram();
  const { account } = useAuth();

  const useGetNoncesQueryParams = (
    account: MaybeRef<string | null>,
    managerPublicKey: MaybeRef<string | undefined | null>,
    managerPeerIdStr: MaybeRef<string | undefined | null>,
  ) => ({
    queryKey: ["nonces", account, managerPublicKey, managerPeerIdStr],
    queryFn: async () =>
      getNoncesQueryFn(
        account,
        managerPublicKey as string,
        managerPeerIdStr as string,
      ),
    enabled: () => {
      return !!account && !!managerPublicKey && !!managerPeerIdStr;
    },
  });

  const useGetNoncesAsyncQuery = async (
    managerPublicKey: MaybeRef<string>,
    managerPeerIdStr: MaybeRef<string>,
    recipient: MaybeRef<string | null> = account,
  ) => {
    const data = await queryClient.ensureQueryData({
      revalidateIfStale: true,
      ...useGetNoncesQueryParams(recipient, managerPublicKey, managerPeerIdStr),
    });
    return data;
  };

  const getNoncesQueryFn = async (
    account: MaybeRef<string | null>,
    managerPublicKey: MaybeRef<string | null>,
    managerPeerIdStr: MaybeRef<string | null>,
  ) => {
    const acc = unref(account);
    const pubKey = unref(managerPublicKey);
    const peerId = unref(managerPeerIdStr);

    if (!acc || !pubKey || !peerId) {
      throw new Error("Missing required parameters for getNonces");
    }

    const remoteAccount = await getRecipientManagerDataAccount(acc, pubKey);

    //remote nonce could be null if the account does not exist
    const remoteNonce = remoteAccount?.exists ? remoteAccount.data.nonce : null;

    const { instance } = storeToRefs(useWorkerStore());
    if (!instance.value) {
      throw new Error("Worker instance is not available");
    }

    const localMax =
      (await instance.value.getMaxNonce({
        managerPeerIdStr: peerId,
        managerPublicKey: pubKey,
        recipient: acc,
      })) ?? 0;

    const remoteBigInt = remoteNonce !== null ? BigInt(remoteNonce) : 0n;
    const localBigInt = BigInt(localMax);
    const nextNonce =
      (remoteBigInt > localBigInt ? remoteBigInt : localBigInt) + 1n;

    return {
      nextNonce,
      remoteNonce,
      localNonce: localMax,
    };
  };

  const useGetNoncesQuery = (
    managerPublicKey: Ref<string | undefined | null>,
    managerPeerIdStr: Ref<string | undefined | null>,
  ) =>
    useQuery({
      ...useGetNoncesQueryParams(account, managerPublicKey, managerPeerIdStr),
    });

  return {
    useGetNoncesQuery,
    useGetNoncesAsyncQuery,
  };
};
