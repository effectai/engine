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
import { Keypair, PublicKey } from "@solana/web3.js";
import { EffectStakingIdl, type EffectStaking } from "@effectai/shared";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useDeriveRewardAccounts } from "@effectai/utils";

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

	const stakeProgram = new anchor.Program(
		EffectStakingIdl as Idl,
		provider,
	) as unknown as Program<EffectStaking>;

	const { vestingProgram } = useVestingProgram();
	const { rewardsProgram } = useRewardProgram();

	const queryClient = useQueryClient();

	const useDeriveStakeAccounts = (stakeAccount: PublicKey) => {
		if (!publicKey.value) {
			throw new Error("Could not get public key");
		}

		const [stakeVaultAccount] = PublicKey.findProgramAddressSync(
			[stakeAccount.toBuffer()],
			stakeProgram.programId,
		);

		return {
			stakeVaultAccount,
		};
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
			mutationFn: async ({
				stakeAccount,
				amount,
			}: { stakeAccount: StakingAccount; amount: number }) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const { rewardAccount, reflectionAccount } = useDeriveRewardAccounts({
					stakingAccount: stakeAccount.publicKey,
					programId: rewardsProgram.programId,
				});

				const { stakeVaultAccount } = useDeriveStakeAccounts(
					stakeAccount.publicKey,
				);

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

						stake: stakeAccount.publicKey,
						vaultTokenAccount: stakeVaultAccount,

						vestingAccount: vestmentAccount.publicKey,
						vestingVaultAccount: vestingVaultAccount,

						mint,
						rewardAccount,
					})
					.postInstructions([
						await rewardsProgram.methods
							.enter()
							.accounts({
								stake: stakeAccount.publicKey,
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

				const { rewardAccount, reflectionAccount } = useDeriveRewardAccounts({
					stakingAccount: stakeAccount.publicKey,
					programId: rewardsProgram.programId,
				});

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
												stake: stakeAccount.publicKey,
												reflection: reflectionAccount,
											})
											.instruction(),
									]),
						])
						.accounts({ userTokenAccount: ata, stake: stakeAccount.publicKey })
						.postInstructions([
							...(
								await rewardsProgram.methods
									.sync()
									.accounts({
										stake: stakeAccount.publicKey,
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

				console.log("staking..");

				const [reflectionAccount] = PublicKey.findProgramAddressSync(
					[Buffer.from("reflection")],
					rewardsProgram.programId,
				);

				const stakeAccount = Keypair.generate();

				await stakeProgram.methods
					.stake(
						new anchor.BN(amount * 1000000),
						new anchor.BN(unstakeDays * SECONDS_PER_DAY),
					)
					.accounts({
						stake: stakeAccount.publicKey,
						userTokenAccount: ata,
						mint,
					})
					.signers([stakeAccount])
					.postInstructions([
						...(
							await rewardsProgram.methods
								.enter()
								.accounts({
									stake: stakeAccount.publicKey,
									reflection: reflectionAccount,
								})
								.transaction()
						).instructions,
					])
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

				const stakingAccounts = await stakeProgram.account.stakeAccount.all([
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
