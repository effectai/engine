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
    const { publicKey } = useWallet();

	const rewardsProgram = computed(() => {
		return new anchor.Program(
			EffectRewardsIdl as Idl,
			provider.value || undefined
		) as unknown as Program<EffectRewards>;
	});

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
					mint,
					programId: rewardsProgram.value.programId,
				});

				const account =
					await rewardsProgram.value.account.reflectionAccount.fetch(
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

				const { reflectionAccount } = useDeriveRewardAccounts({
					mint,
					programId: rewardsProgram.value.programId,
				});

				const ata = getAssociatedTokenAddressSync(mint, publicKey.value);

				return await rewardsProgram.value.methods
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
						stakeAccount: stakeAccount.publicKey,
						recipientTokenAccount: ata,
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
					mint,
					programId: rewardsProgram.value.programId,
				});

				const account =
					await rewardsProgram.value.account.rewardAccount.fetch(rewardAccount);

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
