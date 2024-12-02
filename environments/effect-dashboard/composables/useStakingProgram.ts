import { useWallet } from "solana-wallets-vue";
import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { useAnchorProvider } from "./useAnchorProvider";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
	EffectStakingIdl,
	EffectVestingIdl,
	EffectRewardsIdl,
	type EffectStaking,
	type EffectRewards,
	type EffectVesting,
} from "@effectai/shared";

import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";

const SECONDS_PER_DAY = 86400;

export function useStakingProgram() {
	const appConfig = useRuntimeConfig();
	const { connection } = useGlobalState();
	const { publicKey, sendTransaction } = useWallet();
	const { provider } = useAnchorProvider();
	const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);

	const stakeProgram = new anchor.Program(
		EffectStakingIdl as Idl,
		provider,
	) as unknown as Program<EffectStaking>;

	const rewardsProgram = new anchor.Program(
		EffectRewardsIdl as Idl,
		provider,
	) as unknown as Program<EffectRewards>;

	const {vestingProgram} = useVestingProgram();

	const queryClient = useQueryClient();

	const useDeriveStakeAccounts = () => {
		if (!publicKey.value) {
			throw new Error("Could not get public key");
		}

		const [reflectionAccount] = PublicKey.findProgramAddressSync(
			[Buffer.from("reflection")],
			rewardsProgram.programId,
		);

		const [stakeAccount] = PublicKey.findProgramAddressSync(
			[Buffer.from("stake"), mint.toBuffer(), publicKey.value.toBuffer()],
			stakeProgram.programId,
		);

		const [stakeVaultAccount] = PublicKey.findProgramAddressSync(
			[stakeAccount.toBuffer()],
			stakeProgram.programId,
		);

		const [rewardAccount] = PublicKey.findProgramAddressSync(
			[Buffer.from("rewards"), publicKey.value.toBuffer()],
			rewardsProgram.programId,
		);

		return {
			stakeAccount,
			rewardAccount,
			reflectionAccount,
			stakeVaultAccount,
		};
	};

	const useClaimRewards = () =>
		useMutation({
			mutationFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { stakeAccount, reflectionAccount, rewardAccount } =
					useDeriveStakeAccounts();
				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				return await rewardsProgram.methods
					.claim()
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
						stake: stakeAccount,
						reward: rewardAccount,
						reflection: reflectionAccount,
						user: ata,
					})
					.rpc();
			},
		});

	const useGetReflectionAccount = () => {
		return useQuery({
			queryKey: ["reflectionAccount", publicKey.value],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { reflectionAccount } = useDeriveStakeAccounts();
				const account =
					await rewardsProgram.account.reflectionAccount.fetch(
						reflectionAccount,
					);

				return account;
			},
		});
	};

	const useGetRewardAccount = () => {
		return useQuery({
			queryKey: ["rewardAccount", publicKey.value],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { rewardAccount } = useDeriveStakeAccounts();
				const account =
					await rewardsProgram.account.rewardAccount.fetch(rewardAccount);

				return account;
			},
		});
	};

	const useUnstake = () =>
		useMutation({
			onSuccess: () => {
				queryClient.invalidateQueries({
					predicate: (query) => {
						return query.queryKey.includes("unstake");
					},
				});
			},
			mutationFn: async ({ amount }: { amount: number }) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const {
					stakeAccount,
					rewardAccount,
					reflectionAccount,
					stakeVaultAccount,
				} = useDeriveStakeAccounts();

				// create a new pubkey for unstake vestment
				const vestmentAccount = Keypair.generate();

				const [vestingVaultAccount] = PublicKey.findProgramAddressSync(
					[vestmentAccount.publicKey.toBuffer()],
					vestingProgram.programId,
				);

				return await stakeProgram.methods
					.unstake(new anchor.BN(amount * 1000000))
					.preInstructions([
						...((await connection.getAccountInfo(rewardAccount))
							? [
									await rewardsProgram.methods
										.close()
										.accounts({
											reflection: reflectionAccount,
											reward: rewardAccount,
										})
										.instruction(),
								]
							: []),
					])
					.accounts({
						recipientTokenAccount: ata,

						stake: stakeAccount,
						vaultTokenAccount: stakeVaultAccount,

						vestingAccount: vestmentAccount.publicKey,
						vestingAccountUnchecked: vestmentAccount.publicKey,
						vestingVaultAccount: vestingVaultAccount,

						mint,
						rewardAccount,
					})
					.postInstructions([
						await rewardsProgram.methods
							.enter()
							.accounts({
								stake: stakeAccount,
								reflection: reflectionAccount,
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
				amount,
			}: {
				amount: number;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const { stakeAccount, reflectionAccount, rewardAccount } =
					useDeriveStakeAccounts();

				console.log("stakeAccount", stakeAccount.toBase58());

				try {
					return await stakeProgram.methods
						.topup(new anchor.BN(amount * 1000000))
						.preInstructions([
							...((await connection.getAccountInfo(rewardAccount))
								? []
								: [
										await rewardsProgram.methods
											.enter()
											.accounts({
												stake: stakeAccount,
												reflection: reflectionAccount,
											})
											.instruction(),
									]),
						])
						.accounts({ userTokenAccount: ata, stake: stakeAccount })
						.postInstructions([
							...(
								await rewardsProgram.methods
									.sync()
									.accounts({
										stake: stakeAccount,
										reward: rewardAccount,
										reflection: reflectionAccount,
									})
									.transaction()
							).instructions,
						])
						.rpc();
				} catch (e) {
					console.log(e);
				}
			},
		});

	// const stakeClient = createStakeClient(stakeConfig, program);
	const useGetStakeAccount = () => {
		const query = useQuery({
			queryKey: ["stake", publicKey.value],
			retry: 0,
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { stakeAccount } = useDeriveStakeAccounts();

				const account =
					await stakeProgram.account.stakeAccount.fetchAndContext(stakeAccount);

				return account;
			},
		});

		const amount = computed(() => query.data.value?.data?.amount);
		const amountFormatted = computed(() => {
			const amount = query.data.value?.data?.amount;
			return amount ? amount.toNumber() / 1000000 : 0;
		});
		const unstakeDays = computed(
			() =>
				query.data.value?.data?.duration &&
				query.data.value.data.duration.toNumber() / SECONDS_PER_DAY,
		);

		return { ...query, amount, unstakeDays, amountFormatted };
	};

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

				const [stakeAccount] = PublicKey.findProgramAddressSync(
					[Buffer.from("stake"), mint.toBuffer(), publicKey.value.toBuffer()],
					stakeProgram.programId,
				);

				const [reflectionAccount] = PublicKey.findProgramAddressSync(
					[Buffer.from("reflection")],
					rewardsProgram.programId,
				);

				await stakeProgram.methods
					.stake(
						new anchor.BN(amount * 1000000),
						new anchor.BN(unstakeDays * SECONDS_PER_DAY),
					)
					.accounts({ userTokenAccount: ata, mint })
					.postInstructions([
						...(
							await rewardsProgram.methods
								.enter()
								.accounts({
									stake: stakeAccount,
									reflection: reflectionAccount,
								})
								.transaction()
						).instructions,
					])
					.rpc();
			},
		});

	return {
		stakeProgram,
		rewardsProgram,
		useStake,
		useUnstake,
		useTopUp,
		useGetReflectionAccount,
		useGetStakeAccount,
		useClaimRewards,
		useGetRewardAccount,
	};
}
