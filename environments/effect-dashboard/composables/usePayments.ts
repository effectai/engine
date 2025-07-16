// import type { Payment } from "@effectai/protocol";
import type { Payment, PaymentRecord } from "@effectai/protocol";
import { useMutation, useQuery } from "@tanstack/vue-query";
import pLimit from "p-limit";

export const usePayments = () => {
  const workerStore = useWorkerStore();
  const { instance } = storeToRefs(workerStore);

  const useGetTotalAmountFromPayments = () => {
    const sessionStore = useSessionStore();
    const { manager } = storeToRefs(sessionStore);

    return useQuery({
      queryKey: ["payment-amount", manager.value?.peerId],
      queryFn: async () => {
        if (!manager.value?.peerId) {
          throw new Error("Manager peerId not set.");
        }

        return await instance.value?.countPaymentAmount({
          managerPeerIdStr: manager.value?.peerId,
        });
      },
      enabled: computed(() => !!instance.value && !!manager.value?.peerId),
    });
  };

  const useGetClaimablePayments = () => {
    const { worker } = storeToRefs(workerStore);

    const { managerPeerId, managerPublicKey } = useSession();
    const { useGetNoncesQuery } = useNonce();
    const { data: nonces } = useGetNoncesQuery(managerPublicKey, managerPeerId);

    const { account } = useAuth();

    return useQuery({
      queryKey: [
        "claimable-payments",
        account,
        nonces.value
          ? {
              localNonce: nonces.value.localNonce?.toString(),
              remoteNonce: nonces.value.remoteNonce?.toString(),
            }
          : null,
      ],
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
    const totalProofs = ref(0);
    const currentProof = ref(0);
    const currentPhase = ref(
      "idle" as "generating_proofs" | "bulking" | "submitting",
    );

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

        currentPhase.value = "generating_proofs";
        totalProofs.value = paymentBatches.length + 2;

        //request batches in parallel
        const proofPromises = paymentBatches.map(async (batch) =>
          proofLimit(async () => {
            currentProof.value++;

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

        if (proofs.length > 1) {
          const [bulkedProof, error] = await worker.value.requestBulkProofs(
            managerPeerId.value,
            proofs,
          );

          if (!bulkedProof || error) {
            throw new Error(
              `Something went wrong while bulking proofs. ${error}`,
            );
          }

          await claimWithProofs([bulkedProof]);
        } else if (proofs.length === 1) {
          await claimWithProofs(proofs);
        } else {
          throw new Error("No valid proofs to submit");
        }
      },
    });

    return {
      ...mutation,
      currentProof,
      currentPhase,
      totalProofs,
    };
  };

  return {
    useClaimPayments,
    useGetClaimablePayments,
    useGetTotalAmountFromPayments,
  };
};
