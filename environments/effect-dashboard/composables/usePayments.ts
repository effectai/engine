import type { Payment } from "@effectai/protocol";
import type { PublicKey } from "@solana/web3.js";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/vue-query";

export const usePayments = () => {
  const currentNonce = computed(() => Math.max(0, 1));
  const workerStore = useWorkerStore();
  const { paymentCounter, worker } = storeToRefs(workerStore);

  const useGetMaxNonce = (managerPeerId: string) => {
    return useQuery({
      queryKey: ["maxNonce", managerPeerId, paymentCounter],
      queryFn: async () => {
        if (!workerStore.managerPeerId) {
          throw new Error("Manager peer ID is not set");
        }

        return await worker.value?.getMaxNonce({
          managerPeerIdStr: workerStore.managerPeerId.toString(),
        });
      },
    });
  };

  const useGetPayments = () =>
    useQuery({
      queryKey: ["payments", paymentCounter],
      queryFn: async () => {
        const data = await workerStore.worker?.getPayments({ limit: 100 });
        return data;
      },
      placeholderData: keepPreviousData,
    });

  const useClaimPayments = () =>
    useMutation({
      mutationFn: async ({ payments }: { payments: Payment[] }) => {
        const { claimWithProof } = usePaymentProgram();

        if (!workerStore.managerPeerId) {
          throw new Error("Manager peer ID is not set");
        }

        if (!workerStore.worker) {
          throw new Error("Worker is not initialized");
        }

        const [proof, error] = await workerStore.worker.requestPaymentProof(
          workerStore.managerPeerId,
          payments,
        );

        if (error || !proof) {
          console.error("Error claiming payments", error);
          throw error;
        }

        //use proof to claim from smart contract
        const result = await claimWithProof(proof);

        return result;
      },
    });

  return {
    currentNonce,
    useGetPayments,
    useClaimPayments,
    useGetMaxNonce,
  };
};

export const useNextNonce = async (
  workerPublicKey: PublicKey,
  managerPublicKey: PublicKey,
  managerPeerIdStr: string,
) => {
  const workerStore = useWorkerStore();
  const { worker } = storeToRefs(workerStore);

  const [remoteNonce, maxLocalNonce] = await Promise.all([
    usePaymentProgram().fetchRemoteNonce(workerPublicKey, managerPublicKey),
    worker.value?.getMaxNonce({ managerPeerIdStr }) ?? Promise.resolve(0),
  ]);

  const remoteBigInt = remoteNonce !== null ? BigInt(remoteNonce) : 0n;
  const localBigInt = maxLocalNonce !== null ? BigInt(maxLocalNonce) : 0n;

  const highestNonce = remoteBigInt > localBigInt ? remoteBigInt : localBigInt;

  return highestNonce + 1n;
};
