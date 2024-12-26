import { describe, expect, it } from "vitest";
import { useAnchor, useStakeTestHelpers } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import { mintToAccount, setup } from "../../utils/spl.js";
import {
	useDeriveRewardAccounts, useDeriveStakingRewardAccount
} from "@effectai/utils";
import type { EffectStaking } from "../../target/types/effect_staking.js";
const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Effect Reward Program", async () => {
	const program = anchor.workspace.EffectRewards as Program<EffectRewards>;
	const stakingProgram = anchor.workspace
		.EffectStaking as Program<EffectStaking>;
	const { provider, payer } = useAnchor();
	const { useCreateStake } = useStakeTestHelpers(stakingProgram);

	describe("Reward Claim", async () => {
		it.concurrent("should correctly claim a reward", async () => {
			const { mint, ata } = await setup({
				provider,
				payer,
				amount: 10_000_000,
			});

			// create reflection
			await program.methods
				.init()
				.accounts({
					mint,
				})
				.rpc();

			const {
				reflectionVaultAccount,
				intermediaryReflectionVaultAccount,
			} = useDeriveRewardAccounts({
				mint,
				programId: program.programId,
			});

			// send tokens to intermediary reflection vault
			await mintToAccount({
				mint,
				amount: 10_000_000,
				payer,
				mintAuthority: payer,
				destination: intermediaryReflectionVaultAccount,
				provider,
			});

			// create a stake account
			const { stakeAccount } = await useCreateStake({
				amount: 5_000_000,
				authority: payer.publicKey,
				mint,
				userTokenAccount: ata,
			});

			// enter reward acccount
			await program.methods
				.enter()
				.accounts({
					mint,
					stakeAccount: stakeAccount.publicKey,
				})
				.rpc();

			const { stakingRewardAccount } = useDeriveStakingRewardAccount({
				stakingAccount: stakeAccount.publicKey,
				programId: program.programId,
			});

			const { stakeAccount: anotherStakeAccount } = await useCreateStake({
				amount: 5_000_000,
				authority: payer.publicKey,
				mint,
				userTokenAccount: ata,
			});

			// enter second reward acccount
			await program.methods
				.enter()
				.accounts({
					mint,
					stakeAccount: anotherStakeAccount.publicKey,
				})
				.rpc();

			// call topup
			await program.methods
				.topup()
				.accounts({
					mint,
				})
				.rpc();

			const rewardAccount =
				await program.account.rewardAccount.fetch(stakingRewardAccount);

			expect(rewardAccount.weightedAmount.toNumber()).toEqual(5_000_000);

			// claim reward
			await program.methods
				.claim()
				.accounts({
					stakeAccount: stakeAccount.publicKey,
					recipientTokenAccount: ata,
				})
				.rpc();

			// get reward account vault
			const rewardAccountVault =
				await provider.connection.getTokenAccountBalance(
					reflectionVaultAccount,
				);

			// get ata balance
			const ataBalance = await provider.connection.getTokenAccountBalance(ata);

			expect(ataBalance.value.uiAmount).toEqual(5);
			expect(rewardAccountVault.value.uiAmount).toEqual(5);
		});
	});

	describe("Reward Enter", async () => {
		// create a stake
		it.concurrent("should correctly enter a reward account", async () => {
			const { mint, ata } = await setup({ provider, payer });

			await program.methods
				.init()
				.accounts({
					mint,
				})
				.rpc();

			const stakeAccount = new anchor.web3.Keypair();

			await stakingProgram.methods
				.stake(new anchor.BN(10 ** 6), new anchor.BN(30 * SECONDS_PER_DAY))
				.accounts({
					stakeAccount: stakeAccount.publicKey,
					userTokenAccount: ata,
					mint,
				})
				.postInstructions([
					...(
						await program.methods
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

			const { stakingRewardAccount } = useDeriveStakingRewardAccount({
				stakingAccount: stakeAccount.publicKey,
				programId: program.programId,
			});

			const rewardAccount =
				await program.account.rewardAccount.fetch(stakingRewardAccount);
			expect(rewardAccount.authority).toEqual(payer.publicKey);
		});
	});

	describe("Reward Topup", async () => {
		it.concurrent("should correctly topup", async () => {
			const { mint, ata } = await setup({ provider, payer });

			await program.methods
				.init()
				.accounts({
					mint,
				})
				.signers([payer])
				.rpc();

			const {
				reflectionAccount,
				reflectionVaultAccount,
				intermediaryReflectionVaultAccount,
			} = useDeriveRewardAccounts({
				mint,
				programId: program.programId,
			});

			// send tokens to intermediary reflection vault
			await mintToAccount({
				mint,
				amount: 1000_000_000,
				payer,
				mintAuthority: payer,
				destination: intermediaryReflectionVaultAccount,
				provider,
			});

			// create a stake account
			const { stakeAccount } = await useCreateStake({
				amount: 5_000_000,
				authority: payer.publicKey,
				mint,
				userTokenAccount: ata,
			});

			// enter reward acccount
			await program.methods.enter().accounts({
				mint,
				stakeAccount: stakeAccount.publicKey,
			}).rpc()

			// call topup
			await program.methods
				.topup()
				.accounts({
					mint,
				})
				.rpc();

			const reflection =
				await program.account.reflectionAccount.fetch(reflectionAccount);

			// fetch two vaults
			const reflectionVaultTokenBalance =
				await provider.connection.getTokenAccountBalance(
					reflectionVaultAccount,
				);

			const intermediaryReflectionVaultTokenBalance =
				await provider.connection.getTokenAccountBalance(
					intermediaryReflectionVaultAccount,
				);

			expect(reflection.totalWeightedAmount.toNumber()).toEqual(1005_000_000);
			expect(reflectionVaultTokenBalance.value.uiAmount).toEqual(1000);
			expect(intermediaryReflectionVaultTokenBalance.value.uiAmount).toEqual(0);
		});
	});
});
