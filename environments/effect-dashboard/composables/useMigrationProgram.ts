import { PublicKey, StakeProgram, Transaction } from "@solana/web3.js";
import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationOptions,
	type UseQueryReturnType,
} from "@tanstack/vue-query";

import { useAnchorWallet, useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import programIDL from "../../../solana/target/idl/effect_migration.json";
import type { EffectMigration } from "../../../solana/target/types/effect_migration";

import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
	useDeriveMigrationAccounts,
	useDeriveStakeAccounts,
} from "@effectai/utils";

export const useMigrationProgram = () => {
	const wallet = useAnchorWallet();
	const config = useRuntimeConfig();

	const { publicKey, sendTransaction } = useWallet();
	const { connection } = useGlobalState();

	const provider = new anchor.AnchorProvider(connection, wallet.value, {});

	const queryClient = useQueryClient();

	const { stakeProgram } = useStakingProgram();

	type Claim = {
		type: "stake" | "token";
		amount: number;
		data: StakeClaimAccount | TokenClaimAccount;
	};

	type StakeClaimAccount = Awaited<
		ReturnType<typeof program.account.claimStakeAccount.fetch>
	>;

	type TokenClaimAccount = Awaited<
		ReturnType<typeof program.account.claimTokenAccount.fetch>
	>;

	const program = new anchor.Program(
		programIDL as Idl,
		provider,
	) as unknown as Program<EffectMigration>;

	const { foreignPublicKey } = useGlobalState();

	const migrationAccounts = computed(() => {
		if (!publicKey.value || !foreignPublicKey.value) return null;

		return useDeriveMigrationAccounts({
			initializer: new PublicKey(config.public.EFFECT_VAULT_INITIALIZER),
			mint: new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
			foreignPublicKey: foreignPublicKey.value,
			programId: program.programId,
		});
	});

	const stakeClaimAccount = computed(
		() => migrationAccounts.value?.stakeClaimAccount,
	);

	const tokenClaimAccount = computed(
		() => migrationAccounts.value?.tokenClaimAccount,
	);

	const stakeClaimVaultAccount = computed(
		() => migrationAccounts.value?.stakeClaimVault,
	);

	const tokenClaimVaultAccount = computed(
		() => migrationAccounts.value?.tokenClaimVault,
	);

	const useGetClaims = (): UseQueryReturnType<Claim[], Error> => {
		return useQuery({
			queryKey: ["claims", publicKey.value],
			queryFn: async () => {
				if (
					!stakeClaimAccount.value ||
					!tokenClaimAccount.value ||
					!tokenClaimVaultAccount.value ||
					!stakeClaimVaultAccount.value
				) {
					throw new Error("Missing claim accounts");
				}

				const claims: Claim[] = [];

				const stakeClaimData =
					await program.account.claimStakeAccount.fetchNullable(
						stakeClaimAccount.value,
					);

				const tokenClaimData =
					await program.account.claimTokenAccount.fetchNullable(
						tokenClaimAccount.value,
					);

				if (tokenClaimData) {
					const balance = await connection.getTokenAccountBalance(
						tokenClaimVaultAccount.value,
					);

					if (balance.value.uiAmount > 0) {
						claims.push({
							type: "token",
							amount: balance.value.uiAmount || 0,
							data: tokenClaimData,
						});
					}
				}

				if (stakeClaimData) {
					const balance = await connection.getTokenAccountBalance(
						stakeClaimVaultAccount.value,
					);

					if (balance.value.uiAmount > 0) {
						claims.push({
							type: "stake",
							amount: balance.value.uiAmount || 0,
							data: stakeClaimData,
						});
					}
				}

				return claims;
			},
			enabled: computed(
				() => !!stakeClaimAccount.value && !!tokenClaimAccount.value,
			),
		});
	};

	const useClaim = ({
		options,
	}: {
		options: UseMutationOptions<
			string,
			Error,
			{
				claimAccount: StakeClaimAccount | TokenClaimAccount;
			}
		>;
	}) =>
		useMutation({
			...options,
			onSuccess: () => {
				queryClient.invalidateQueries({
					predicate: (query) => {
						return query.queryKey.includes("claims");
					},
				});
			},
			mutationFn: async ({
				claimAccount,
			}: {
				claimAccount: StakeClaimAccount | TokenClaimAccount;
			}) => {
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

				if ("stakeStartTime" in claimAccount) {
					// dealing with a stake claim account
					const { stakeAccount, vaultAccount } = useDeriveStakeAccounts({
						mint,
						authority: publicKey.value,
						programId: stakeProgram.programId,
					});

					if (!stakeClaimAccount.value || !stakeClaimVaultAccount.value) {
						throw new Error("Missing stake claim accounts");
					}

					return await program.methods
						.claimStake(
							Buffer.from(signature.value),
							Buffer.from(message.value),
						)
						.preInstructions([
							...((await connection.getAccountInfo(ata))
								? []
								: [
										createAssociatedTokenAccountIdempotentInstructionWithDerivation(
											publicKey.value,
											publicKey.value,
											mint,
										),
									]),
						])
						.accounts({
							payer: publicKey.value,
							mint,
							recipientTokenAccount: ata,
							stakeVaultAccount: vaultAccount,
							stakeAccount,
							claimAccount: stakeClaimAccount.value,
							vaultAccount: stakeClaimVaultAccount.value,
						})
						.rpc();
				}

				if (!tokenClaimAccount.value || !tokenClaimVaultAccount.value) {
					throw new Error("Missing token claim accounts");
				}

				return await program.methods
					.claimTokens(Buffer.from(signature.value), Buffer.from(message.value))
					.preInstructions([
						...((await connection.getAccountInfo(ata))
							? []
							: [
									createAssociatedTokenAccountIdempotentInstructionWithDerivation(
										publicKey.value,
										publicKey.value,
										mint,
									),
								]),
					])
					.accounts({
						payer: publicKey.value,
						mint,
						recipientTokenAccount: ata,
						claimAccount: tokenClaimAccount.value,
						vaultAccount: tokenClaimVaultAccount.value,
					})
					.rpc();
			},
		});

	return {
		program,
		migrationAccounts,
		useClaim,
		useGetClaims,
	};
};
