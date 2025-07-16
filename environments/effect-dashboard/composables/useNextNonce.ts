import type { PublicKey } from "@solana/web3.js";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

export const useNonce = () => {
  const queryClient = useQueryClient();
  const { account } = useAuth();
  const { getRecipientManagerDataAccount } = usePaymentProgram();

  const useGetNoncesQueryParams = (
    managerPublicKey: MaybeRef<string | undefined | null>,
    managerPeerIdStr: MaybeRef<string | undefined | null>,
  ) => ({
    queryKey: ["nonces", account, managerPublicKey, managerPeerIdStr],
    queryFn: async () => getNoncesQueryFn,
    enabled: () => {
      return !!account && !!managerPublicKey && !!managerPeerIdStr;
    },
  });

  const useGetNoncesAsyncQuery = async (
    managerPublicKey: MaybeRef<string>,
    managerPeerIdStr: MaybeRef<string>,
  ) => {
    const data = await queryClient.ensureQueryData(
      useGetNoncesQueryParams(managerPublicKey, managerPeerIdStr),
    );
  };

  const getNoncesQueryFn = async (
    account: string,
    managerPublicKey: MaybeRef<string>,
    managerPeerIdStr: MaybeRef<string>,
  ) => {
    if (!managerPublicKey) {
      throw new Error("Manager public key or peer ID is missing");
    }

    console.log("query fn");
    console.log(managerPublicKey);

    const remoteAccount = await getRecipientManagerDataAccount(
      account,
      managerPublicKey,
    );

    //remote nonce could be null if the account does not exist
    const remoteNonce = remoteAccount?.exists ? remoteAccount.data.nonce : null;

    const { instance } = storeToRefs(useWorkerStore());
    if (!instance.value) {
      throw new Error("Worker instance is not available");
    }

    const localMax =
      (await instance.value.getMaxNonce({
        managerPeerIdStr,
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
      ...useGetNoncesQueryParams(managerPublicKey, managerPeerIdStr),
    });

  return {
    useGetNoncesQuery,
    useGetNoncesAsyncQuery,
  };
};
