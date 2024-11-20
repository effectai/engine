import { deriveMetadataAndVaultFromPublicKey } from "@effectai/utils";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
	useMutation,
	useQuery,
	type UseMutationOptions,
} from "@tanstack/vue-query";

import { useAnchorWallet, useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
//TODO::
import programIDL from "../../../solana/target/idl/solana_snapshot_migration.json";
import type { SolanaSnapshotMigration } from "../../../solana/target/types/solana_snapshot_migration";

import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export const useMigrationProgram = () => {
	const wallet = useAnchorWallet();
	const config = useRuntimeConfig();

	const { publicKey, sendTransaction } = useWallet();
	const { connection } = useGlobalState();

	const provider = new anchor.AnchorProvider(connection, wallet.value, {});

	const program = new anchor.Program(
		programIDL as Idl,
		provider,
	) as unknown as Program<SolanaSnapshotMigration>;

	const { foreignPublicKey } = useGlobalState();

	const metadataAndVault = computed(() => {
		if (!publicKey.value || !foreignPublicKey.value) return null;

		return deriveMetadataAndVaultFromPublicKey(
			new PublicKey(config.public.EFFECT_VAULT_INITIALIZER),
			new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
			foreignPublicKey.value,
			program.programId,
		);
	});

	const metadataAccount = computed(() => metadataAndVault.value?.metadata);
	const vaultAccount = computed(() => metadataAndVault.value?.vault);

	const useGetVaultAccountBalance = () =>
		useQuery({
			queryKey: ["vault-balance", publicKey.value?.toBase58()],
			queryFn: async () => {
				try {
					if (!vaultAccount.value) {
						return null;
					}
					const balance = await connection.getTokenAccountBalance(
						vaultAccount.value,
					);
					if (!balance.value.uiAmount) {
						return 0;
					}
					return balance.value.uiAmount;
				} catch (e) {
					console.error(e);
					return 0;
				}
			},
			enabled: computed(() => !!vaultAccount.value),
		});

	const useClaim = ({
		options,
	}: {
		options: UseMutationOptions<Awaited<ReturnType<typeof sendTransaction>>>;
	}) =>
		useMutation({
			...options,
			mutationFn: async () => {
				const { foreignPublicKey, message, signature } = useGlobalState();

				if (
					!publicKey.value ||
					!foreignPublicKey.value ||
					!message.value ||
					!signature.value
				) {
					throw new Error("Missing required data");
				}

				const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);
				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const { metadata, vault } = deriveMetadataAndVaultFromPublicKey(
					new PublicKey(config.public.EFFECT_VAULT_INITIALIZER),
					new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
					foreignPublicKey.value,
					program.programId,
				);

				const transaction = new Transaction();

				// check if user ata exists
				const ataAccount = await connection.getAccountInfo(ata);
				if (!ataAccount) {
					transaction.add(
						createAssociatedTokenAccountIdempotentInstructionWithDerivation(
							publicKey.value,
							publicKey.value,
							mint,
						),
					);
				}

				const claimTx = await program.methods
					.claim(Buffer.from(signature.value), Buffer.from(message.value))
					.accounts({
						payer: publicKey.value,
						recipientTokens: ata,
						metadataAccount: metadata,
						vaultAccount: vault,
					})
					.transaction();

				transaction.add(claimTx);

				// send the transaction
				return await sendTransaction(transaction, connection);
			},
		});

	return {
		program,
		metadataAccount,
		vaultAccount,
		useClaim,
		useGetVaultAccountBalance,
	};
};
