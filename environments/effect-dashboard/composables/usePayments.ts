import type { Payment } from "@effectai/protocol";
import type { PublicKey } from "@solana/web3.js";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/vue-query";

export const usePayments = () => {
  const workerStore = useWorkerStore();
  const { paymentCounter } = storeToRefs(workerStore);

  const useGetPayments = () =>
    useQuery({
      queryKey: ["payments", paymentCounter],
      queryFn: async () => {
        const data = await workerStore.worker?.getPayments({});
        return data;
      },
      placeholderData: keepPreviousData,
    });

  const useClaimPayments = () =>
    useMutation({
      mutationFn: async ({ payments }: { payments: Payment[] }) => {
        const { claimWithProof } = usePaymentProgram();
        const sessionStore = useSessionStore();
        const { managerPeerId } = sessionStore.useActiveSession();

        if (!workerStore.worker || !managerPeerId.value) {
          throw new Error("Session data is not initialized");
        }

        const [proof, error] = await workerStore.worker.requestPaymentProof(
          managerPeerId.value,
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
    useGetPayments,
    useClaimPayments,
  };
};
