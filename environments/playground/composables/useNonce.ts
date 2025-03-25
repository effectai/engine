import type { PublicKey } from "@solana/web3.js";

const remoteNonce: Ref<bigint | null> = ref(null);

export const useNonce = () => {
	const highestLocalNonce = computed(() => {
		const { paymentStore } = useWorkerNode();
		return paymentStore.value.reduce(
			(max, payment) => (payment.nonce > max ? payment.nonce : max),
			0n, // Default starting nonce
		);
	});

	const fetchNonces = async (worker: PublicKey, manager: PublicKey) => {
		const { fetchRemoteNonce } = usePaymentProgram();
		const remoteNonceResult = await fetchRemoteNonce(worker, manager);

		remoteNonce.value = remoteNonceResult;

		const nextNonce = await getNextNonce(
			remoteNonceResult,
			highestLocalNonce.value,
		);

		return { remoteNonce, highestLocalNonce, nextNonce };
	};

	const getNextNonce = async (
		smartContractNonce: bigint,
		highestLocalNonce: bigint,
	): Promise<bigint> => {
		if (highestLocalNonce > smartContractNonce) {
			return highestLocalNonce + 1n;
		}

		return smartContractNonce + 1n;
	};

	return { remoteNonce, getNextNonce, highestLocalNonce, fetchNonces };
};
