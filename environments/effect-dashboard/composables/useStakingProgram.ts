import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type {
	Program,
	Idl,
	ProgramAccount,
	IdlAccounts,
} from "@coral-xyz/anchor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useAnchorProvider } from "./useAnchorProvider";
import { ComputeBudgetProgram, Keypair, PublicKey } from "@solana/web3.js";
import { EffectStakingIdl, type EffectStaking } from "@effectai/shared";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useDeriveStakingRewardAccount } from "@effectai/utils";

const SECONDS_PER_DAY = 86400;

export type EffectStakingProgramAccounts = IdlAccounts<EffectStaking>;
export type StakingAccount = ProgramAccount<
	EffectStakingProgramAccounts["stakeAccount"]
>;

export function useStakingProgram() {
	const appConfig = useRuntimeConfig();
	const { connection } = useGlobalState();
	const { publicKey } = useWallet();
	const { provider } = useAnchorProvider();

	const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);

	const stakeProgram = computed(() => {
		return new anchor.Program(
			EffectStakingIdl as Idl,
			provider.value || undefined,
		) as unknown as Program<EffectStaking>;
	});

	const { rewardsProgram } = useRewardProgram();

	const queryClient = useQueryClient();

	const useUnstake = () =>
		useMutation({
			onSuccess: () => {
				queryClient.invalidateQueries({
					predicate: (query) => {
						return (
							query.queryKey.includes("stake") ||
							query.queryKey.includes("unstake")
						);
					},
				});
			},
			mutationFn: async ({
				stakeAccount,
				amount,
			}: { stakeAccount: StakingAccount; amount: number }) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const { stakingRewardAccount } = useDeriveStakingRewardAccount({
					stakingAccount: stakeAccount.publicKey,
					programId: rewardsProgram.value.programId,
				});

				const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
					microLamports: 100_000,
				});

				// create a new pubkey for unstake vestment
				const vestmentAccount = Keypair.generate();

				return await stakeProgram.value.methods
					.unstake(new anchor.BN(amount * 1000000))
					.preInstructions([
						addPriorityFee,
						...((await connection.getAccountInfo(stakingRewardAccount))
							? [
									await rewardsProgram.value.methods
										.close()
										.accounts({
											stakeAccount: stakeAccount.publicKey,
										})
										.instruction(),
								]
							: []),
					])
					.accounts({
						recipientTokenAccount: ata,
						stakeAccount: stakeAccount.publicKey,
						vestingAccount: vestmentAccount.publicKey,
						mint,
					})
					.postInstructions([
						await rewardsProgram.value.methods
							.enter()
							.accounts({
								mint,
								stakeAccount: stakeAccount.publicKey,
							})
							.instruction(),
					])
					.signers([vestmentAccount])
					.rpc();
			},
		});

	const useTopUp = () =>
		useMutation({
			onSuccess: () => {
				queryClient.invalidateQueries({
					predicate: (query) => {
						return query.queryKey.includes("stake");
					},
				});
			},
			mutationFn: async ({
				stakeAccount,
				amount,
			}: {
				stakeAccount: StakingAccount;
				amount: number;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const { stakingRewardAccount } = useDeriveStakingRewardAccount({
					stakingAccount: stakeAccount.publicKey,
					programId: rewardsProgram.value.programId,
				});

				try {
					return await stakeProgram.value.methods
						.topup(new anchor.BN(amount * 1000000))
						.preInstructions([
							...((await connection.getAccountInfo(stakingRewardAccount))
								? []
								: [
										await rewardsProgram.value.methods
											.enter()
											.accounts({
												mint,
												stakeAccount: stakeAccount.publicKey,
											})
											.instruction(),
									]),
						])
						.accounts({
							userTokenAccount: ata,
							stakeAccount: stakeAccount.publicKey,
						})
						.postInstructions([
							...(
								await rewardsProgram.value.methods
									.sync()
									.accounts({
										stakeAccount: stakeAccount.publicKey,
									})
									.transaction()
							).instructions,
						])
						.rpc();
				} catch (e) {
					console.log(e);

					throw e;
				}
			},
		});

	const useStake = () =>
		useMutation({
			onSuccess: () => {
				queryClient.invalidateQueries({
					predicate: (query) => {
						return query.queryKey.includes("stake");
					},
				});
			},
			mutationFn: async ({
				amount,
				unstakeDays,
			}: {
				amount: number;
				unstakeDays: number;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const stakerATA = await connection.getAccountInfo(ata);

				if (!stakerATA) {
					throw new Error("Could not get staker ATA");
				}

				const stakeAccount = Keypair.generate();

				await stakeProgram.value.methods
					.stake(
						new anchor.BN(amount * 1000000),
						new anchor.BN(30 * SECONDS_PER_DAY),
					)
					.accounts({
						stakeAccount: stakeAccount.publicKey,
						userTokenAccount: ata,
						mint,
					})
					.postInstructions([
						...(
							await rewardsProgram.value.methods
								.enter()
								.accounts({
									mint,
									stakeAccount: stakeAccount.publicKey,
								})
								.transaction()
						).instructions,
					])
					.signers([stakeAccount])
					.rpc();
			},
		});

	const useGetStakeAccount = () => {
		const query = useQuery({
			queryKey: ["stake", publicKey.value],
			retry: 0,
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const stakingAccounts =
					await stakeProgram.value.account.stakeAccount.all([
						{
							memcmp: {
								offset: 8 + 8,
								encoding: "base58",
								bytes: publicKey.value.toBase58(),
							},
						},
					]);

				return stakingAccounts[0];
			},
		});

		// computed helpers
		const amount = computed(() => query.data.value?.account?.amount);
		const amountFormatted = computed(() => {
			const amount = query.data.value?.account?.amount;
			return amount ? amount.toNumber() / 1000000 : 0;
		});

		const unstakeDays = computed(
			() =>
				query.data.value?.account?.lockDuration &&
				query.data.value.account.lockDuration.toNumber() / SECONDS_PER_DAY,
		);

		return { ...query, amount, unstakeDays, amountFormatted };
	};

	return {
		stakeProgram,
		rewardsProgram,
		useStake,
		useUnstake,
		useTopUp,
		useGetStakeAccount,
	};
}
