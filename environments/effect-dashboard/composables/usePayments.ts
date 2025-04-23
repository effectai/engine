import type { Payment } from "@effectai/protocol";
import type { PublicKey } from "@solana/web3.js";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/vue-query";

const remoteNonce: Ref<bigint | null> = ref(null);

export const usePayments = () => {
  const currentNonce = computed(() => Math.max(0, 1));
  const workerStore = useWorkerStore();
  const { paymentCounter } = storeToRefs(workerStore);

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

        console.log("claiming payments", payments.length);
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
  };
};
