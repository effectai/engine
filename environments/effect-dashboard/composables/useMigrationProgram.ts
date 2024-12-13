import { Keypair, PublicKey, StakeProgram, Transaction, type TokenAmount } from "@solana/web3.js";
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
	useDeriveStakingRewardAccount,
} from "@effectai/utils";
import { base64 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import type { StakingAccount } from "./useStakingProgram";

export type EffectMigrationProgramAccounts =
	anchor.IdlAccounts<EffectMigration>;
export type MigrationClaimAccount = anchor.ProgramAccount<
	EffectMigrationProgramAccounts["migrationAccount"]
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

	const program = new anchor.Program(
		EffectMigrationIdl as Idl,
		provider,
	) as unknown as Program<EffectMigration>;

	const { foreignPublicKey } = useGlobalState();

	const useGetMigrationAccount = (): UseQueryReturnType<MigrationClaimAccount["account"] & {
		vaultBalance: {
			value: TokenAmount;
		}
	}, Error> => {
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

				const { migrationAccount, vaultAccount } = useDeriveMigrationAccounts({
					mint: new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
					foreignPublicKey: foreignPublicKey.value,
					programId: program.programId,
				});

				const data = await program.account.migrationAccount.fetchNullable(migrationAccount);
				const vaultBalance = await connection.getTokenAccountBalance(vaultAccount);

				return {
					...data,
					vaultBalance,
				};
			},
			enabled: computed(() => !!publicKey.value && !!foreignPublicKey.value),
		});
	};

	const useClaim = ({
		options,
	}: {
		options: UseMutationOptions<
			string,
			Error
		>;
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

				const signers: Keypair[] = [];
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

				const {stakingRewardAccount} = useDeriveStakingRewardAccount({
					stakingAccount: stakingAccount.publicKey,
					programId: rewardsProgram.programId,
				})

				return await program.methods
					.claimStake(Buffer.from(signature.value), Buffer.from(message.value), Buffer.from(foreignPublicKey.value))
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
											stakeAccount: stakingAccount.publicKey,
											userTokenAccount: ata,
											mint,
										})
										.signers(signers)
										.instruction(),
								]
							: []),
					])
					.postInstructions([
						...((await connection.getAccountInfo(stakingRewardAccount))
							? []
							: [
									await rewardsProgram.methods
										.enter()
										.accounts({
											mint,
											stakeAccount: stakingAccount.publicKey,
										})
										.signers(signers)
										.instruction(),
								]),
					])
					.accounts({
						mint,
						recipientTokenAccount: ata,
						stakeAccount: stakingAccount.publicKey,
					})
					.signers(signers)
					.rpc();
			},
		});

	return {
		program,
		useGetMigrationAccount,
		useClaim,
	};
};
