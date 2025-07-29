// import type { Payment } from "@effectai/protocol";
import {
  fetchMaybeRecipientManagerDataAccount,
  PAYMENT_BATCH_SIZE,
  type Payment,
  type PaymentRecord,
} from "@effectai/protocol";

import { useMutation, useQuery } from "@tanstack/vue-query";
import pLimit from "p-limit";

export const usePayments = () => {
  const workerStore = useWorkerStore();
  const { instance, datastore } = storeToRefs(workerStore);
  const { account } = useAuth();
  const { useGetNoncesAsyncQuery } = useNonce();

  const useGetPaymentsQuery = () => {
    return useQuery({
      queryKey: ["payments", account.value],
      queryFn: async () => {
        assertExists(instance.value, "Worker instance is not initialized");
        const data = await getAllManagersFromPayments();

        return data;
      },
    });
  };

  const computedTotalPaymentAmount = (
    queryResult: ReturnType<typeof useGetPaymentsQuery>["data"],
  ) =>
    computed(() =>
      (queryResult.value ?? []).reduce(
        (acc, manager) =>
          acc +
          manager.claimablePayments?.reduce(
            (sum, payment) => sum + payment.state.amount / BigInt(1e6),
            0n,
          ),
        0n,
      ),
    );

  // const totalUnclaimedEffect = computed(() => {
  //   return managerPaymentBatches.value?.reduce((total, record) => {
  //     const claimableAmount = record.claimablePayments.reduce((sum, payment) => {
  //       return sum + (payment.state.amount || 0n);
  //     }, 0n);
  //     return total + claimableAmount;
  //   }, 0n);
  // });
  //

  const getAllManagersFromPayments = async () => {
    assertExists(datastore.value, "Datastore is not initialized");

    const seenManagers = new Set();

    for await (const key of datastore.value.queryKeys({
      prefix: "/payments/",
    })) {
      const [_, index, peerId, managerPublicKey, recipient, nonce] = key
        .toString()
        .split("/");

      seenManagers.add(`${peerId}-${managerPublicKey}-${recipient}`);
    }

    const managerPromises = Array.from(seenManagers).map(
      async (managerKey: string) => {
        const [peerId, managerPublicKey, recipient] = managerKey.split("-");

        const nonces = await useGetNoncesAsyncQuery(
          managerPublicKey,
          peerId,
          recipient,
        );

        const claimablePayments = await instance.value?.getPaymentsFromNonce({
          nonce: Number.parseInt(nonces.remoteNonce?.toString() ?? "0") + 1,
          peerId,
          recipient,
          publicKey: managerPublicKey,
        });

        return {
          peerId,
          managerPublicKey,
          recipient,
          claimablePayments,
        };
      },
    );

    const results = await Promise.all(managerPromises);

    return results;
  };

  const useClaimPayments = () => {
    const totalProofs = ref(0);
    const currentProof = ref(0);
    const currentPhase = ref(
      "idle" as "generating_proofs" | "bulking" | "submitting",
    );

    const mutation = useMutation({
      mutationFn: async ({
        payments,
        managerPeerId,
        managerPublicKey,
      }: {
        managerPeerId: string;
        managerPublicKey: string;
        payments: PaymentRecord[];
      }) => {
        const workerStore = useWorkerStore();
        const { instance } = storeToRefs(workerStore);
        const { claimWithProof } = usePaymentProgram();

        const { recipient, paymentAccount } = payments[0].state;

        const sortedPayments = payments
          .toSorted((a, b) => {
            return a.state.nonce > b.state.nonce ? 1 : -1;
          })
          .map((p) => p.state);

        const paymentBatches = chunkArray(sortedPayments, PAYMENT_BATCH_SIZE);
        const proofLimit = pLimit(1);

        currentPhase.value = "generating_proofs";
        totalProofs.value = paymentBatches.length + 2;

        //request batches in parallel
        const proofPromises = paymentBatches.map(async (batch) =>
          proofLimit(async () => {
            currentProof.value++;

            assertExists(instance.value, "Worker instance is not initialized");

            const [proof, error] = await instance.value.requestPaymentProof(
              managerPeerId,
              batch,
            );

            if (error || !proof) {
              throw new Error(`Error while generating proof ${error}`);
            }

            return proof;
          }),
        );

        const proofs = (await Promise.all(proofPromises)).filter(Boolean);

        assertExists(instance.value, "Worker instance is not initialized");
        if (proofs.length > 1) {
          const [bulkedProof, error] = await instance.value.requestBulkProofs(
            managerPeerId,
            recipient,
            paymentAccount,
            proofs,
          );

          if (!bulkedProof || error) {
            throw new Error(
              `Something went wrong while bulking proofs. ${error}`,
            );
          }

          await claimWithProof(bulkedProof, managerPublicKey, paymentAccount);
        } else if (proofs.length === 1) {
          await claimWithProof(proofs[0], managerPublicKey, paymentAccount);
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
    getAllManagersFromPayments,
    useGetPaymentsQuery,
    computedTotalPaymentAmount,
  };
};
