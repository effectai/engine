import { Keypair, PublicKey, type TokenAmount } from "@solana/web3.js";
import {
	useMutation,
	useQuery,
	type UseQueryReturnType,
} from "@tanstack/vue-query";

import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { EffectMigrationIdl, type EffectMigration } from "@effectai/shared";

import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
	useDeriveMigrationAccounts,
	useDeriveStakingRewardAccount,
} from "@effectai/utils";
import type { StakingAccount } from "./useStakingProgram";

export type EffectMigrationProgramAccounts =
	anchor.IdlAccounts<EffectMigration>;
export type MigrationClaimAccount = anchor.ProgramAccount<
	EffectMigrationProgramAccounts["migrationAccount"]
>;

const SECONDS_PER_DAY = 86400;

export const useMigrationProgram = () => {
	const config = useRuntimeConfig();

	const { publicKey } = useWallet();
	const { connection } = useGlobalState();

	const { provider } = useAnchorProvider();
	const { rewardsProgram } = useStakingProgram();
	const { stakeProgram } = useStakingProgram();

	const migrationProgram = new anchor.Program(
		EffectMigrationIdl as Idl,
		provider,
	) as unknown as Program<EffectMigration>;

	const useGetMigrationVaultBalance = (migrationAccount: MigrationClaimAccount['account']) => {
		return useQuery({
			queryKey: ["claims", "vault-balance", publicKey.value],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Missing required data");
				}

				const {vaultAccount} = useDeriveMigrationAccounts({
					mint: new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT),
					foreignPublicKey: migrationAccount.foreignPublicKey,
					programId: migrationProgram.programId,
				});

				return await connection.getTokenAccountBalance(
					vaultAccount,
				);
			}
		})
	}

	const useGetMigrationAccount = (
		foreignPublicKey: Ref<Uint8Array | undefined | null>,
	): UseQueryReturnType<
		MigrationClaimAccount['account'],
		Error
	> => {
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
					programId: migrationProgram.programId,
				});

				return await migrationProgram.account.migrationAccount.fetchNullable(
					migrationAccount,
				);
			},
			enabled: computed(() => !!publicKey.value && !!foreignPublicKey.value),
		});
	};

	const useClaim = () =>
		useMutation({
			mutationFn: async ({
				foreignPublicKey,
				signature,
				message,
			}: {
				foreignPublicKey: Uint8Array;
				signature: Uint8Array;
				message: Uint8Array;
			}) => {

				const { provider } = useAnchorProvider();

				const migrationProgram = new anchor.Program(
					EffectMigrationIdl as Idl,
					provider,
				) as unknown as Program<EffectMigration>;

				const { publicKey } = useWallet();

				if (!publicKey.value) {
					throw new Error("Not connected to a solana wallet");
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

				const { stakingRewardAccount } = useDeriveStakingRewardAccount({
					stakingAccount: stakingAccount.publicKey,
					programId: rewardsProgram.programId,
				});

				return await migrationProgram.methods
					.claimStake(
						Buffer.from(signature),
						Buffer.from(message),
						Buffer.from(foreignPublicKey),
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
		migrationProgram,
		useGetMigrationAccount,
		useGetMigrationVaultBalance,
		useClaim,
	};
};
