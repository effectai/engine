import { useQuery } from "@tanstack/vue-query";
import {
	ABICache,
	Action,
	PlaceholderAuth,
	Transaction,
	TransactionHeader,
	type Session,
} from "@wharfkit/session";
import type { SourceWalletAdapter, WalletMeta } from "~/types/types";
import { extractEosPublicKeyBytes } from "@effectai/utils";

import { SessionKit } from "@wharfkit/session";
import { WebRenderer } from "@wharfkit/web-renderer";
import { WalletPluginAnchor } from "@effectai/wallet-plugin-anchor";
import type { PublicKey } from "@solana/web3.js";

// import { WalletPluginCleos } from "@wharfkit/wallet-plugin-cleos";
// import { WalletPluginScatter } from "@wharfkit/wallet-plugin-scatter"
// import { WalletPluginWombat } from "@wharfkit/wallet-plugin-wombat"
// import { WalletPluginTokenPocket } from "@wharfkit/wallet-plugin-tokenpocket"

const session: Ref<Session | null | undefined> = ref(null);

const sessionKit = reactive(
	new SessionKit({
		appName: "Effect Migration Portal",
		chains: [
			{
				id: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
				url: "https://eos.greymass.com",
			},
		],
		ui: new WebRenderer(),
		walletPlugins: [
			new WalletPluginAnchor({}),
		],
	}),
);

export const useEosWallet = (): SourceWalletAdapter => {
	const address = computed(
		() => session.value?.actor.toString() as string | undefined,
	);

	const walletMeta: Ref<WalletMeta | undefined | null> = computed(
		() =>
			session.value && {
				name: session.value.walletPlugin.metadata.name,
				icon: session.value.walletPlugin.metadata.logo?.light,
			},
	);

	const isConnected = computed(() => !!session.value);

	const connect = async () => {
		const result = await sessionKit.login();
		session.value = result.session;
	};

	const disconnect = async () => {
		session.value = null;
		return await sessionKit.logout();
	};

	const useGetBalanceQuery = () => {
		return useQuery({
			queryKey: ["balance", session.value?.actor],
			queryFn: async () => {
				if (!session.value?.client) {
					throw new Error("No client found");
				}

				const res = await session.value.client.v1.chain.get_currency_balance(
					"eosio.token",
					session.value.actor,
					"EOS",
				);

				if (res.length === 0) {
					return 0;
				}

				return {
					value: res[0].value,
					symbol: "EOS",
				};
			},
		});
	};

	const useGetEfxBalanceQuery = () => {
		return useQuery({
			queryKey: ["efx-balance", session.value?.actor],
			queryFn: async () => {
				if (!session.value?.client) {
					throw new Error("No client found");
				}

				const res = await session.value.client.v1.chain.get_currency_balance(
					"effecttokens",
					session.value.actor,
					"EFX",
				);

				if (res.length === 0) {
					return 0;
				}

				return {
					value: res[0].value,
					symbol: "EFX",
				};
			},
		});
	};

	const authorizeTokenClaim = async (): Promise<{
		foreignPublicKey: Uint8Array;
		signature: Uint8Array;
		message: Uint8Array;
	}> => {
		const { address } = useSolanaWallet();

		const originalMessage = `Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ${address.value}`;

		if (!session.value?.client) {
			throw new Error("No client found");
		}

		const abi = new ABICache(session.value?.client);
		const eosAbi = await abi.getAbi("effecttokens");

		const action = Action.from(
			{
				account: "effecttokens",
				name: "issue",
				authorization: [PlaceholderAuth],
				data: {
					to: "effectai",
					quantity: "0 EFX",
					memo: originalMessage,
				},
			},
			eosAbi,
		);

		const txHeader = TransactionHeader.from({
			expiration: 0,
			ref_block_num: 0,
			ref_block_prefix: 0,
			delay_sec: 0,
		});

		const tx = Transaction.from({
			actions: [action],
			...txHeader,
		});

		const transaction = await session.value.transact(tx, { broadcast: false });
		const signature = transaction.signatures[0];
		const serializedTxBytes = transaction.resolved?.signingData;

		if (!serializedTxBytes) {
			throw new Error("Could not serialize transaction");
		}

		const res = await session.value.client.v1.chain.get_account(
			session.value.actor,
		);

		const activePermission = res.getPermission("active");
		const publicKey = activePermission.required_auth.keys[0].key.toString();
		const compressedPk = extractEosPublicKeyBytes(publicKey);

		if (!compressedPk) {
			throw new Error("Could not compress public key");
		}

		return {
			signature: signature.data.array,
			message: serializedTxBytes?.array,
			foreignPublicKey: compressedPk,
		};
	};

	return {
		address,
		walletMeta,
		isConnected,

		// Methods
		disconnect,
		connect,

		authorizeTokenClaim,

		// Queries
		useGetEfxBalanceQuery,
		useGetBalanceQuery,
	};
};
