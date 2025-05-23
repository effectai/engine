// import type { Payment } from "@effectai/protocol";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/vue-query";

export const usePayments = () => {
  const workerStore = useWorkerStore();
  const { paymentCounter } = storeToRefs(workerStore);

  const useGetTotalAmountFromPayments = () => {
    const sessionStore = useSessionStore();
    const { managerPeerId } = sessionStore.useActiveSession();
    const { worker } = storeToRefs(workerStore);

    return useQuery({
      queryKey: ["payment-amount", paymentCounter, managerPeerId],
      queryFn: async () => {
        if (!managerPeerId.value) {
          return;
        }

        return await worker.value?.countPaymentAmount({
          managerPeerIdStr: managerPeerId.value,
        });
      },
      enabled: computed(() => !!worker.value && !!managerPeerId.value),
    });
  };

  const useGetPayments = (page: Ref<number>) =>
    useQuery({
      queryKey: ["payments", paymentCounter, page],
      queryFn: async () => {
        const data = await workerStore.worker?.getPaginatedPayments({
          page: page.value,
          perPage: 20,
        });

        return data;
      },
      enabled: computed(() => !!workerStore.worker),
    });

  const useGetClaimablePayments = () => {
    const { worker } = storeToRefs(workerStore);
    const sessionStore = useSessionStore();
    const { managerPeerId, useGetNonce } = sessionStore.useActiveSession();

    const { data: nonces } = useGetNonce();
    const { account } = storeToRefs(sessionStore);

    return useQuery({
      queryKey: ["claimable-payments", paymentCounter, account],
      enabled: computed(() => !!nonces.value?.localNonce),
      queryFn: async () => {
        if (!worker.value || !managerPeerId.value) {
          throw new Error("Worker is not initialized");
        }

        const nonce = nonces.value?.remoteNonce || 0;

        const data = await worker.value.getPaymentsFromNonce({
          nonce: Number.parseInt(nonce.toString()) + 1,
          peerId: managerPeerId.value,
        });

        return data;
      },
    });
  };

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
    useGetClaimablePayments,
    useGetTotalAmountFromPayments,
  };
};
