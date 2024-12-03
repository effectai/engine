import { Keypair, PublicKey, StakeProgram, Transaction } from "@solana/web3.js";
import {
	useMutation,
	useQuery,
	type UseMutationOptions,
	type UseQueryReturnType,
} from "@tanstack/vue-query";

import { useAnchorWallet, useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { EffectMigrationIdl, type EffectMigration } from "@effectai/shared";

import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
	useDeriveMigrationAccounts,
	useDeriveRewardAccounts,
	useDeriveStakeAccounts,
} from "@effectai/utils";
import { base64 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import type { StakingAccount } from "./useStakingProgram";

export type EffectMigrationProgramAccounts =
	anchor.IdlAccounts<EffectMigration>;
export type MigrationClaimAccount = anchor.ProgramAccount<
	EffectMigrationProgramAccounts["claimAccount"]
>;

const SECONDS_PER_DAY = 86400;

export const useMigrationProgram = () => {
	const wallet = useAnchorWallet();
	const config = useRuntimeConfig();

	const { publicKey } = useWallet();
	const { connection } = useGlobalState();

	const provider = new anchor.AnchorProvider(connection, wallet.value, {});
	const { rewardsProgram } = useStakingProgram();
	const { stakeProgram } = useStakingProgram();

	type Claim = {
		type: "stake" | "token";
		amount: number;
		account: MigrationClaimAccount;
	};

	const program = new anchor.Program(
		EffectMigrationIdl as Idl,
		provider,
	) as unknown as Program<EffectMigration>;

	const { foreignPublicKey } = useGlobalState();

	const useGetClaimAccounts = (): UseQueryReturnType<Claim[], Error> => {
		return useQuery({
			queryKey: [
				"claims",
				"claim-accounts",
				publicKey.value,
				foreignPublicKey.value,
			],
			queryFn: async () => {
				if (!publicKey.value || !foreignPublicKey.value) {
					throw new Error("Missing required data");
				}

				const claimAccounts = await program.account.claimAccount.all([
					{
						memcmp: {
							offset: 12,
							encoding: "base64",
							bytes: base64.encode(Buffer.from(foreignPublicKey.value)),
						},
					},
				]);

				if (claimAccounts.length === 0) {
					throw new Error("No claim accounts found");
				}

				const claims: Claim[] = [];
				// map claim accounts to stake or token
				for (const claimAccount of claimAccounts) {
					const { vaultAccount } = useDeriveMigrationAccounts({
						claimAccount: claimAccount.publicKey,
						programId: program.programId,
					});

					const amount = await connection.getTokenAccountBalance(vaultAccount);

					const type = claimAccount.account.claimType.token ? "token" : "stake";

					claims.push({
						type,
						amount: amount.value.uiAmount || 0,
						account: claimAccount,
					});
				}

				return claims;
			},
			enabled: computed(() => !!publicKey.value && !!foreignPublicKey.value),
		});
	};

	const useClaim = ({
		options,
	}: {
		options: UseMutationOptions<
			string,
			Error,
			{
				claim: Claim;
			}
		>;
	}) =>
		useMutation({
			...options,
			mutationFn: async ({
				claim,
			}: {
				claim: Claim;
			}) => {
				const { foreignPublicKey, message, signature } = useGlobalState();

				const { vaultAccount } = useDeriveMigrationAccounts({
					claimAccount: claim.account.publicKey,
					programId: program.programId,
				});

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

				if (claim.type === "stake") {
					let signers: Keypair[] = [];
					let stakingAccount: Keypair | StakingAccount | null = null;

					// check if user has an existing stakingAccount
					const stakingAccounts = await stakeProgram.account.stakeAccount.all([
						{
							memcmp: {
								offset: 8 + 8,
								encoding: "base58",
								bytes: publicKey.value.toBase58(),
							},
						},
					]);

					if (stakingAccounts.length === 0) {
						stakingAccount = Keypair.generate();
						signers.push(stakingAccount);
					} else {
						stakingAccount = stakingAccounts[0];
					}

					const { vaultAccount: stakeVaultTokenAccount } =
						useDeriveStakeAccounts({
							stakingAccount: stakingAccount.publicKey,
							programId: stakeProgram.programId,
						});

					const { rewardAccount, reflectionAccount } = useDeriveRewardAccounts({
						authority: publicKey.value,
						programId: rewardsProgram.programId,
					});

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
							...(stakingAccounts.length === 0
								? [
										await stakeProgram.methods
											.stake(
												new anchor.BN(0),
												new anchor.BN(30 * SECONDS_PER_DAY),
											)
											.accounts({
												stake: stakingAccount.publicKey,
												authority: publicKey.value,
												userTokenAccount: ata,
												mint,
											})
											.signers([stakingAccount])
											.instruction(),
									]
								: []),
						])
						.postInstructions([
							...((await connection.getAccountInfo(rewardAccount))
								? []
								: [
										await rewardsProgram.methods
											.enter()
											.accounts({
												stake: stakingAccount.publicKey,
												reflection: reflectionAccount,
											})
											.instruction(),
									]),
						])
						.accounts({
							payer: publicKey.value,
							mint,
							recipientTokenAccount: ata,
							stakeVaultTokenAccount: stakeVaultTokenAccount,
							stakeAccount: stakingAccount.publicKey,
							claimAccount: claim.account.publicKey,
							vaultTokenAccount: vaultAccount,
						})
						.rpc();
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
						claimAccount: claim.account.publicKey,
						vaultAccount,
					})
					.rpc();
			},
		});

	return {
		program,
		useGetClaimAccounts,
		useClaim,
	};
};
