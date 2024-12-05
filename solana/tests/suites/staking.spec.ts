import { describe, expect, it } from "vitest";
import { SECONDS_PER_DAY, useAnchor, useStakeTestHelpers } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectStaking } from "../../target/types/effect_staking.js";
import { setup } from "../../utils/spl.js";
import { useConstantsIDL, useErrorsIDL } from "../../utils/idl.js";
import { stakingIdl } from "../../constants/idl.js";
import stakingIDLJson from "../../target/idl/effect_staking.json";
import { BN } from "bn.js";
import { useBankRunProvider } from "../helpers.js";
import { AccountLayout } from "@solana/spl-token";
import type { EffectVesting } from "../../target/types/effect_vesting.js";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import {
	useDeriveRewardAccounts,
	useDeriveStakeAccounts,
	useDeriveVestingAccounts,
} from "@effectai/utils";

describe("Staking Program", async () => {
	const idl = stakingIDLJson as EffectStaking;
	const program = anchor.workspace.EffectStaking as Program<EffectStaking>;
	const vestingProgram = anchor.workspace
		.EffectVesting as Program<EffectVesting>;
	const rewardProgram = anchor.workspace
		.EffectRewards as Program<EffectRewards>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();
	const { useCreateStake } = useStakeTestHelpers(program);

	describe("Stake Initialize", async () => {
		it.concurrent("should correctly initialize a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });
			await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});
		});

		it.concurrent(
			"should fail when stake duration is below the minimum duration",
			async () => {
				const { mint, ata } = await setup({ provider, payer });
				const { DURATION_TOO_SHORT } = useErrorsIDL(stakingIdl);
				const { STAKE_DURATION_MIN } = useConstantsIDL(stakingIdl);

				await expectAnchorError(async () => {
					await useCreateStake({
						lockTimeInDays: STAKE_DURATION_MIN.sub(new BN(1)).toNumber(),
						authority: wallet.publicKey,
						mint,
						userTokenAccount: ata,
					});
				}, DURATION_TOO_SHORT);
			},
		);

		it.concurrent(
			"should fail when stake duration is above the maximum duration",
			async () => {
				const { mint, ata } = await setup({ payer, provider });
				const { STAKE_DURATION_MAX } = useConstantsIDL(stakingIdl);
				const { DURATION_TOO_LONG } = useErrorsIDL(stakingIdl);

				await expectAnchorError(async () => {
					await useCreateStake({
						lockTimeInDays: STAKE_DURATION_MAX.add(new BN(1)).toNumber(),
						authority: wallet.publicKey,
						mint,
						userTokenAccount: ata,
					});
				}, DURATION_TOO_LONG);
			},
		);

		it.concurrent("should correctly stake the minimum amount", async () => {
			const { mint, ata } = await setup({ payer, provider });
			const { STAKE_MINIMUM_AMOUNT, STAKE_DURATION_MIN } =
				useConstantsIDL(stakingIdl);

			await useCreateStake({
				lockTimeInDays: STAKE_DURATION_MIN.toNumber(),
				amount: STAKE_MINIMUM_AMOUNT,
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});
		});
	});

	describe("Stake Unstake", async () => {
		it.concurrent("cannot unstake with an open reward account", async () => {
			const { mint, ata } = await setup({ payer, provider });

			const { stakeAccount, vaultAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});

			const { vaultAccount: stakeVaultAccount } = useDeriveStakeAccounts({
				stakingAccount: stakeAccount.publicKey,
				programId: program.programId,
			});

			const vestingAccount = new anchor.web3.Keypair();

			const { vestingVaultAccount } = useDeriveVestingAccounts({
				vestingAccount: vestingAccount.publicKey,
				authority: wallet.publicKey,
				programId: vestingProgram.programId,
			});

			const { rewardAccount, reflectionAccount } = useDeriveRewardAccounts({
				stakingAccount: stakeAccount.publicKey,
				programId: rewardProgram.programId,
			});

			await rewardProgram.methods
				.enter()
				.accounts({
					stake: stakeAccount.publicKey,
					reflection: reflectionAccount,
				})
				.rpc();

			const { INVALID_REWARD_ACCOUNT } = useErrorsIDL(stakingIdl);

			expectAnchorError(async () => {
				await program.methods
					.unstake(new BN(5_000_000))
					.accounts({
						stake: stakeAccount.publicKey,
						mint,
						vaultTokenAccount: stakeVaultAccount,
						vestingAccount: vestingAccount.publicKey,
						recipientTokenAccount: ata,
						rewardAccount,
						vestingVaultAccount,
					})
					.signers([vestingAccount])
					.rpc();
			}, INVALID_REWARD_ACCOUNT);
		});
		it.concurrent("should correctly unstake a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });

			const { stakeAccount, vaultAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});

			const { vaultAccount: stakeVaultAccount } = useDeriveStakeAccounts({
				stakingAccount: stakeAccount.publicKey,
				programId: program.programId,
			});

			const vestingAccount = new anchor.web3.Keypair();

			const { vestingVaultAccount } = useDeriveVestingAccounts({
				vestingAccount: vestingAccount.publicKey,
				authority: wallet.publicKey,
				programId: vestingProgram.programId,
			});

			const { rewardAccount } = useDeriveRewardAccounts({
				stakingAccount: stakeAccount.publicKey,
				programId: rewardProgram.programId,
			});

			await program.methods
				.unstake(new BN(5_000_000))
				.accounts({
					stake: stakeAccount.publicKey,
					mint,
					vaultTokenAccount: stakeVaultAccount,
					vestingAccount: vestingAccount.publicKey,
					recipientTokenAccount: ata,
					rewardAccount,
					vestingVaultAccount,
				})
				.signers([vestingAccount])
				.rpc();

			// expect to have a vesting account
			const vestingAccountData =
				await vestingProgram.account.vestingAccount.fetch(
					vestingAccount.publicKey,
				);
			expect(vestingAccountData).to.be.not.null;

			// expect to have balance in the vesting vault account
			const vestingVaultAccountData =
				await provider.connection.getTokenAccountBalance(vestingVaultAccount);
			expect(vestingVaultAccountData.value.uiAmount).toBe(5);
		});
	});

	// describe("Stake Extension", async () => {});
	describe("Stake Topup", async () => {
		it('dilutes stake age when "topup" is called', async () => {
			const {
				program: bankrunProgram,
				provider,
				useTimeTravel,
			} = await useBankRunProvider(idl);

			const { mint, ata } = await setup({
				payer: provider.wallet.payer,
				provider: provider,
				amount: 2_000_000,
			});

			const stakeAccount = new anchor.web3.Keypair();

			await bankrunProgram.methods
				.stake(new BN(1_000_000), new BN(30 * SECONDS_PER_DAY))
				.accounts({
					stake: stakeAccount.publicKey,
					authority: provider.wallet.payer.publicKey,
					userTokenAccount: ata,
					mint,
				})
				.signers([stakeAccount])
				.rpc();

			// get stake account
			const { vaultAccount } = useDeriveStakeAccounts({
				stakingAccount: stakeAccount.publicKey,
				programId: program.programId,
			});

			// fetch stake account
			const account = await bankrunProgram.account.stakeAccount.fetch(
				stakeAccount.publicKey,
			);

			// wait 30 days
			await useTimeTravel(30);

			await bankrunProgram.methods
				.topup(new BN(1_000_000))
				.accounts({
					userTokenAccount: ata,
					stake: stakeAccount.publicKey,
				})
				.rpc();

			// fetch stake account
			const account2 = await bankrunProgram.account.stakeAccount.fetch(
				stakeAccount.publicKey,
			);

			// expect stake age to be diluted
			expect(account.stakeStartTime.toNumber()).to.be.lessThan(
				account2.stakeStartTime.toNumber(),
			);

			const balance = await provider.connection.getAccountInfo(vaultAccount);
			if (!balance) throw new Error("Balance not found");
			const result = AccountLayout.decode(balance.data);
			expect(result.amount).toBe(2_000_000n);
		});
	});
});
