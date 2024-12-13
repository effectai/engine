import type { SourceWalletAdapter, WalletMeta } from "~/types/types";
import {
	useAccount,
	useConnect,
	useDisconnect,
	useConfig,
} from "@wagmi/vue";
import { useQuery } from "@tanstack/vue-query";
import { getBalance, signMessage } from "@wagmi/core";
import { toBytes } from 'viem'

export const useBscWallet = (): SourceWalletAdapter => {
	const { address, isConnected, connector } = useAccount();
	const config = useConfig();

	const { connect } = useConnect();
	const { disconnect } = useDisconnect();

	const walletMeta: Ref<WalletMeta | undefined | null> = computed(
		() =>
			connector.value && {
				name: connector.value.name,
				icon: connector.value.icon,
			},
	);

	const useGetBalanceQuery = () => {
		return useQuery({
			queryKey: ["balance", address.value],
			queryFn: async () => {
				if (!address.value) {
					throw new Error("No address found");
				}

				const balance = await getBalance(config, {
					address: address.value,
				});

				return {
					symbol: "BNB",
					value: Number(balance.formatted),
				};
			},
		});
	};

	const useGetEfxBalanceQuery = () => {
		return useQuery({
			queryKey: ["efx-balance", address.value],
			queryFn: async () => {
				if (!address.value) {
					throw new Error("No address found");
				}

				const balance = await getBalance(config, {
					address: address.value,
					token: "0xC51Ef828319b131B595b7ec4B28210eCf4d05aD0",
				});

				return {
					symbol: "EFX",
					value: Number(balance.formatted),
				};
			},
		});
	};

	const authorizeTokenClaim = async (): Promise<{
		foreignPublicKey: Uint8Array;
		signature: Uint8Array;
		message: Uint8Array;
	}> => {
		const { address: solanaAddress } = useSolanaWallet()

		if (!address.value) {
			throw new Error("No public key");
		}

		const originalMessage = `Effect.AI: I authorize my tokens to be claimed at the following Solana address:${solanaAddress.value}`;
		const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
		const message = Buffer.from(prefix + originalMessage);
		const signature = await signMessage(config, { message: originalMessage });

		if(!address.value){
			throw new Error("No address found");
		}

		return {
			foreignPublicKey: toBytes(address.value),
			signature: toBytes(signature),
			message
		}

	};

	return {
		address,
		isConnected,
		walletMeta,

		useGetBalanceQuery,
		useGetEfxBalanceQuery,

		authorizeTokenClaim,

		connect,
		disconnect,
	};
};
