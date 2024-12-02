import { Keypair, PublicKey, StakeProgram, Transaction } from "@solana/web3.js";
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
	useDeriveRewardAccounts,
	useDeriveStakeAccounts,
} from "@effectai/utils";
import { base64 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export const useMigrationProgram = () => {
	const wallet = useAnchorWallet();
	const config = useRuntimeConfig();

	const { publicKey, sendTransaction } = useWallet();
	const { connection } = useGlobalState();

	const provider = new anchor.AnchorProvider(connection, wallet.value, {});

	const queryClient = useQueryClient();

	const { rewardsProgram } = useStakingProgram();

	const { stakeProgram } = useStakingProgram();

	type Claim = {
		type: "stake" | "token";
		amount: number;
		data: ClaimAccount;
		publicKey: PublicKey;
	};

	type ClaimAccount = Awaited<
		ReturnType<typeof program.account.claimAccount.fetch>
	>;

	const program = new anchor.Program(
		programIDL as Idl,
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
						data: claimAccount.account,
						publicKey: claimAccount.publicKey,
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
					claimAccount: claim.publicKey,
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

				const stakingAccount = new Keypair();

				const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);
				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				if (claim.type === "stake") {
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
							claimAccount: claim.publicKey,
							vaultTokenAccount: vaultAccount,
						})
						.signers([stakingAccount])
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
						claimAccount: claim.publicKey,
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
