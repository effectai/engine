import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { EffectRewardsIdl, type EffectRewards } from "@effectai/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { StakingAccount } from "./useStakingProgram";
import { useWallet } from "solana-wallets-vue";
import {
	useDeriveRewardAccounts,
	useDeriveStakingRewardAccount,
} from "@effectai/utils";
import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import type { VestingAccount } from "./useVestingProgram";

export const useRewardProgram = () => {
	const { provider } = useAnchorProvider();
	const { publicKey } = useWallet();

	const rewardsProgram = computed(() => {
		return new anchor.Program(
			EffectRewardsIdl as Idl,
			provider.value || undefined,
		) as unknown as Program<EffectRewards>;
	});

	const appConfig = useRuntimeConfig();
	const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);
	const { vestingProgram } = useVestingProgram();

	const queryClient = useQueryClient();

	const useGetReflectionAccount = () => {
		return useQuery({
			queryKey: ["reflectionAccount", publicKey.value],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { reflectionAccount, reflectionVaultAccount } =
					useDeriveRewardAccounts({
						mint,
						programId: rewardsProgram.value.programId,
					});

				const account =
					await rewardsProgram.value.account.reflectionAccount.fetch(
						reflectionAccount,
					);

				const vaultAccount = connection.getTokenAccountBalance(
					reflectionVaultAccount,
				);

				return { reflectionAccont: account, vaultAccount };
			},
		});
	};

	const useClaimRewards = () =>
		useMutation({
			onSuccess: () => {
				queryClient.invalidateQueries({
					predicate: (query) => {
						return query.queryKey.includes("claim");
					},
				});
			},
			mutationFn: async ({
				stakeAccount,
				vestingRewardAccount,
			}: {
				vestingRewardAccount: VestingAccount;
				stakeAccount: StakingAccount;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
					microLamports: 100_000,
				});

				const { reflectionAccount, reflectionVaultAccount } =
					useDeriveRewardAccounts({
						mint,
						programId: rewardsProgram.value.programId,
					});

				const { stakingRewardAccount } = useDeriveStakingRewardAccount({
					stakingAccount: stakeAccount.publicKey,
					programId: rewardsProgram.value.programId,
				});

				return await rewardsProgram.value.methods
					.claim()
					.preInstructions([
						priorityFee,

						// claim vestment
						await vestingProgram.value.methods
							.claim()
							.accounts({
								vestingAccount: vestingRewardAccount.publicKey,
							})
							.instruction(),

						// topup rewards
						await rewardsProgram.value.methods
							.topup()
							.accounts({
								mint: mint,
							})
							.instruction(),

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
					.accountsPartial({
						reflectionAccount: reflectionAccount,
						rewardAccount: stakingRewardAccount,
						authority: publicKey.value,
						stakeAccount: stakeAccount.publicKey,
						recipientTokenAccount: ata,
					})
					.rpc();
			},
		});

	const useGetRewardAccount = (
		stakeAccount: Ref<StakingAccount | undefined>,
	) => {
		return useQuery({
			queryKey: ["rewardAccount", publicKey, "claim"],
			enabled: computed(() => !!stakeAccount.value),
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				if (!stakeAccount.value) {
					throw new Error("Stake account is not defined");
				}

				const { stakingRewardAccount } = useDeriveStakingRewardAccount({
					stakingAccount: stakeAccount.value.publicKey,
					programId: rewardsProgram.value.programId,
				});

				const account =
					await rewardsProgram.value.account.rewardAccount.fetch(
						stakingRewardAccount,
					);

				return account;
			},
		});
	};

	const { intermediaryReflectionVaultAccount } = useDeriveRewardAccounts({
		programId: rewardsProgram.value.programId,
		mint: mint,
	});

	return {
		rewardsProgram,
		intermediaryReflectionVaultAccount,
		useClaimRewards,
		useGetRewardAccount,
		useGetReflectionAccount,
	};
};
