// import type { Payment } from "@effectai/protocol";
import type { Payment, PaymentRecord } from "@effectai/protocol";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/vue-query";
import pLimit from "p-limit";

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

  const useClaimPayments = () => {
    const progress = reactive({
      currentPhase: "idle" as "generating_proofs" | "bulking" | "submitting",
      totalProofs: 0,
      currentProof: 0,
    });

    const mutation = useMutation({
      onSuccess: () => {
        // Increment the payment counter after successful claim to refresh queries.
        paymentCounter.value++;
      },
      mutationFn: async ({ payments }: { payments: PaymentRecord[] }) => {
        const workerStore = useWorkerStore();
        const { worker } = storeToRefs(workerStore);

        const { claimWithProofs } = usePaymentProgram();
        const sessionStore = useSessionStore();
        const { managerPeerId } = sessionStore.useActiveSession();

        const sortedPayments = payments
          .toSorted((a, b) => {
            return a.state.nonce > b.state.nonce ? 1 : -1;
          })
          .map((p) => p.state);

        const paymentBatches = chunkArray(sortedPayments, 60);
        const proofLimit = pLimit(1);

        progress.currentPhase = "generating_proofs";
        progress.totalProofs = paymentBatches.length + 2;

        //request batches in parallel
        const proofPromises = paymentBatches.splice(0, 2).map(async (batch) =>
          proofLimit(async () => {
            progress.currentProof++;

            if (!worker.value || !managerPeerId.value) {
              throw new Error("worker is not initialized..");
            }

            const [proof, error] = await worker.value.requestPaymentProof(
              managerPeerId.value,
              batch,
            );

            if (error || !proof) {
              throw new Error(`Error while generating proof ${error}`);
            }

            return proof;
          }),
        );

        if (!worker.value || !managerPeerId.value) {
          throw new Error("worker is not initialized..");
        }

        const proofs = (await Promise.all(proofPromises)).filter(Boolean);

        progress.currentPhase = "bulking";
        const [bulkedProof, error] = await worker.value.requestBulkProofs(
          managerPeerId.value,
          proofs,
        );

        progress.currentProof++;
        if (!bulkedProof || error) {
          throw new Error(`something went wrong while proofing. ${error}`);
        }

        progress.currentPhase = "submitting";
        await claimWithProofs([bulkedProof]);

        progress.currentProof++;
      },
    });

    return {
      ...mutation,
      progress,
    };
  };

  return {
    useGetPayments,
    useClaimPayments,
    useGetClaimablePayments,
    useGetTotalAmountFromPayments,
  };
};
