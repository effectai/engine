import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/vue-query";
import { useWallet } from "solana-wallets-vue";
import type { TargetWalletAdapter, WalletMeta } from "~/types/types";

export const useSolanaWallet = (): TargetWalletAdapter => {
	const { connection } = useGlobalState();
	const { connect, disconnect, wallet, publicKey } = useWallet();

	const address = computed(() => publicKey.value?.toBase58());

	const walletMeta: Ref<WalletMeta | undefined | null> = computed(
		() =>
			wallet.value && {
				name: wallet.value.adapter.name,
				icon: wallet.value.adapter.icon,
			},
	);

	const isConnected = computed(() => publicKey.value !== null);

	const useGetBalanceQuery = () =>
		useQuery({
			queryKey: ["solana-balance", publicKey.value],
			enabled: computed(() => publicKey.value !== null),
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("No public key");
				}

				const data = await connection.getBalance(publicKey.value);

				return {
					value: data / 10 ** 9,
					symbol: "SOL",
				};
			},
		});

	const useGetEfxBalanceQuery = () => {
		const { mint } = useGlobalState();
		const { publicKey } = useWallet();

		return useQuery({
			queryKey: ["efx-balance", publicKey.value, "stake"],
			enabled: computed(() => !!publicKey.value !== null),
			queryFn: async () => {

				if (!publicKey.value) {
					throw new Error("No public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				try {
					const balance = await connection.getTokenAccountBalance(ata);
					return {
						value: balance.value.uiAmount || 0,
						symbol: "EFFECT",
					};
				} catch (e) {
					return {
						value: 0,
						symbol: "EFFECT",
					}
				}
			},
		});
	};

	const useGetTokenAccountBalanceQuery = (account: PublicKey) => {
		return useQuery({
			queryKey: ["token-account-balance", account.toBase58( )],
			enabled: computed(() => !!account !== null),
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("No public key");
				}

				try {
					const balance = await connection.getTokenAccountBalance(account);
					return {
						value: balance.value.uiAmount || 0,
						symbol: "EFFECT",
					};
				} catch (e) {
					return {
						value: 0,
						symbol: "EFFECT",
					}
				}
			},
		});
	}


	return {
		// state
		address,
		walletMeta,
		isConnected,

		// queries
		useGetBalanceQuery,
		useGetEfxBalanceQuery,
		useGetTokenAccountBalanceQuery,

		// methods
		connect,
		disconnect,
	};
};
