import { beforeAll, describe, expect, it } from "vitest";
import { useAnchor, useStakeTestHelpers } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import { mintToAccount, setup } from "../../utils/spl.js";
import {
	useDeriveRewardAccounts,
	useDeriveStakeAccounts,
	useDeriveStakingRewardAccount,
} from "@effectai/utils";
import { createVesting } from "../../utils/vesting.js";
import type { EffectVesting } from "../../target/types/effect_vesting.js";
import { PublicKey } from "@solana/web3.js";
import type { EffectStaking } from "../../target/types/effect_staking.js";
const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Effect Reward Program", async () => {
	const program = anchor.workspace.EffectRewards as Program<EffectRewards>;
	const vestingProgram = anchor.workspace
		.EffectVesting as Program<EffectVesting>;
	const stakingProgram = anchor.workspace
		.EffectStaking as Program<EffectStaking>;
	const { provider, payer } = useAnchor();
	const { useCreateStake } = useStakeTestHelpers(stakingProgram);

	beforeAll(async () => {
		it("should correctly initialize a reflection", async () => {
			await program.methods.init().signers([payer]).rpc();
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

	describe("Reward Initialize", async () => {
		it.concurrent("should correctly claim a vesting stream", async () => {
			const { mint } = await setup({ provider, payer });

			await program.methods
				.init()
				.accounts({
					mint,
				})
				.signers([payer])
				.rpc();

			const { reflectionAccount, reflectionVaultAccount } =
				useDeriveRewardAccounts({
					mint,
					programId: program.programId,
				});

			// get now - 1 day
			const yesterday = new Date().getTime() / 1000 - SECONDS_PER_DAY;

			// create a new vesting stream
			const { vestingAccount, vestingVaultAccount } = await createVesting({
				startTime: yesterday,
				releaseRate: 1_000_000,
				tag: "v",
				isRestrictedClaim: true,
				isClosable: false,
				amount: 1_000_000,
				mint,
				payer,
				recipientTokenAccount: reflectionVaultAccount,
				program: vestingProgram,
			});

			const [rewardAuthority] = PublicKey.findProgramAddressSync(
				[Buffer.from("vesting")],
				program.programId,
			);

			// transfer owner of the vesting stream to the rewards program
			await vestingProgram.methods
				.updateAuthority()
				.accounts({
					vestingAccount: vestingAccount.publicKey,
					newAuthority: rewardAuthority,
				})
				.rpc();

			// send some tokens to the vesting stream
			await mintToAccount({
				payer,
				mint,
				destination: vestingVaultAccount,
				amount: 1000_000_000,
				provider,
				mintAuthority: payer,
			});

			await program.methods
				.claimStream()
				.accounts({
					vestingAccount: vestingAccount.publicKey,
				})
				.rpc();

			const reflectionAccountData =
				await program.account.reflectionAccount.fetch(reflectionAccount);
			const reflectionVaultAccountBalance =
				await program.provider.connection.getTokenAccountBalance(
					reflectionVaultAccount,
				);

			expect(reflectionAccountData.totalWeightedAmount.toNumber()).toEqual(
				1000_000_000,
			);
			expect(reflectionVaultAccountBalance.value.uiAmount).toEqual(1000);
		});
	});
});
