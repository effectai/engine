import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { EffectRewardsIdl, type EffectRewards } from "@effectai/shared";
import { useMutation, useQuery } from "@tanstack/vue-query";
import type { StakingAccount } from "./useStakingProgram";
import { useWallet } from "solana-wallets-vue";
import { useDeriveRewardAccounts } from "@effectai/utils";
import { createAssociatedTokenAccountIdempotentInstructionWithDerivation, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";


export const useRewardProgram = () => {
	const { provider } = useAnchorProvider();
    const {publicKey} = useWallet();

	const rewardsProgram = new anchor.Program(
		EffectRewardsIdl as Idl,
		provider,
	) as unknown as Program<EffectRewards>;

    const appConfig = useRuntimeConfig();
    const mint = new PublicKey(appConfig.public.EFFECT_SPL_TOKEN_MINT);

	const useGetReflectionAccount = () => {
		return useQuery({
			queryKey: ["reflectionAccount", publicKey.value],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { reflectionAccount } = useDeriveRewardAccounts({
					authority: publicKey.value,
					programId: rewardsProgram.programId,
				});

				const account =
					await rewardsProgram.account.reflectionAccount.fetch(
						reflectionAccount,
					);

				return account;
			},
		});
	};

	const useClaimRewards = () =>
		useMutation({
			mutationFn: async ({
				stakeAccount,
			}: {
				stakeAccount: StakingAccount;
			}) => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { reflectionAccount, rewardAccount } = useDeriveRewardAccounts({
					authority: publicKey.value,
					programId: rewardsProgram.programId,
				});

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
						stake: stakeAccount.publicKey,
						reward: rewardAccount,
						reflection: reflectionAccount,
						user: ata,
					})
					.rpc();
			},
		});


	const useGetRewardAccount = () => {
		return useQuery({
			queryKey: ["rewardAccount", publicKey.value],
			queryFn: async () => {
				if (!publicKey.value) {
					throw new Error("Could not get public key");
				}

				const { rewardAccount } = useDeriveRewardAccounts({
					authority: publicKey.value,
					programId: rewardsProgram.programId,
				});

				const account =
					await rewardsProgram.account.rewardAccount.fetch(rewardAccount);

				return account;
			},
		});
	};


	return {
		rewardsProgram,
		useClaimRewards,
        useGetRewardAccount,
        useGetReflectionAccount
	};
};
