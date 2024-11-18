import {
	ABICache,
	Action,
	PlaceholderAuth,
	Transaction,
	TransactionHeader,
	type Session,
} from "@wharfkit/session";
import { compressEosPubkey } from "../../../solana/utils/keys";
import { useQuery } from "@tanstack/vue-query";
import { useWallet } from "solana-wallets-vue";
import type { PublicKey } from "@solana/web3.js";

export const useEos = () => {
	const { sessionKit } = useSessionKit();
	const session: Ref<Session | null | undefined> = ref(null);
	const actor = computed(() => session.value?.actor);
	const walletMeta = computed(() => session.value?.walletPlugin.metadata);

	sessionKit.restore().then(async (s) => {
		session.value = s;
	});

	const connect = async () => {
		const result = await sessionKit.login()
		session.value = result.session;
	}

	const disconnect = async () => {
		session.value = null;
		return await sessionKit.logout();
	}

	const useEfxBalanceQuery = () => {
		return useQuery({
			queryKey: ['efx-balance', session.value?.actor],
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


				return res[0].value
			}
		})
	}

	const authorizeTokenClaim = async (payer: PublicKey): Promise<{
		publicKey: Uint8Array;
		signature: Uint8Array;
		message: Uint8Array;
	}> => {

		const originalMessage = `Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ${payer.toBase58()}`;

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
		const compressedPk = compressEosPubkey(publicKey);

		if (!compressedPk) {
			throw new Error("Could not compress public key");
		}

		return {
			signature: signature.data.array,
			message: serializedTxBytes?.array,
			publicKey: compressedPk,
		};
	};

	return {
		session,
		actor,
		walletMeta,
	
		// Methods
		disconnect,
		connect,
		authorizeTokenClaim,

		// Queries
		useEfxBalanceQuery,
	};
};
