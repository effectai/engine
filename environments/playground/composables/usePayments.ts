import { Payment } from "@effectai/protocol";
import { peerIdFromString } from "@libp2p/peer-id";
import { PublicKey } from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";

export const usePayments = () => {
	const { node, paymentStore } = useWorkerNode();
	const { highestLocalNonce, remoteNonce } = useNonce();

	const refreshPaymentStore = async () => {
		if (!node.value) {
			console.error("Node not available yet.");
			return;
		}
		paymentStore.value = await node.value?.services.worker.getPayments();
	};

	const requestProofAndClaimFromContract = () =>
		useMutation({
			mutationFn: async ({ payments }: { payments: Payment[] }) => {
				const { mutateAsync: mutateRequestProof } = requestProof();
				const { claim } = usePaymentProgram();
				const { mutateAsync: mutateClaim } = claim();

				const proof = await mutateRequestProof({ payments });

				if (!proof) {
					throw new Error("Proof not found");
				}

				const claimResult = await mutateClaim({ proof });

				console.log("Claim result", claimResult);
			},
		});

	const requestProof = () =>
		useMutation({
			onSuccess: () => {},
			mutationFn: async ({ payments }: { payments: Payment[] }) => {
				const { node, managerPeerId } = useWorkerNode();

				if (!managerPeerId.value) {
					console.error("Manager Peer ID not available yet.");
					return;
				}

				const proof = await node.value?.services.worker.requestPaymentProof(
					peerIdFromString(managerPeerId.value),
					payments,
				);

				return proof;
			},
		});

	const requestPayout = async (managerPeerId: string) => {
		const peerId = peerIdFromString(managerPeerId);

		if (!node.value) {
			console.error("Node not available yet.");
			return;
		}

		const payment = await node.value.services.worker.requestPayout(peerId);
		paymentStore.value = await node.value.services.worker.getPayments();

		return payment;
	};

	const claimedPayments = computed(() =>
		paymentStore.value.filter(
			(p) =>
				(remoteNonce.value || remoteNonce.value === 0n) &&
				remoteNonce.value >= p.nonce,
		),
	);

	const claimablePayments = computed(() =>
		paymentStore.value.filter(
			(p) =>
				(remoteNonce.value || remoteNonce.value === 0n) &&
				remoteNonce.value < p.nonce,
		),
	);

	const claimedAmount = computed(() =>
		claimedPayments.value.reduce((acc, payment) => acc + payment.amount, 0n),
	);

	const claimableAmount = computed(() =>
		claimablePayments.value.reduce((acc, payment) => acc + payment.amount, 0n),
	);

	return {
		paymentStore,
		refreshPaymentStore,
		requestPayout,
		requestProof,
		requestProofAndClaimFromContract,

		claimedPayments,
		claimablePayments,
		claimedAmount,
		claimableAmount,
	};
};
