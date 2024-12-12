import { beforeAll, describe, expect, it } from "vitest";
import { SECONDS_PER_DAY, useAnchor, useStakeTestHelpers } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectStaking } from "../../target/types/effect_staking.js";
import { setup } from "../../utils/spl.js";
import { useConstantsIDL, useErrorsIDL } from "../../utils/idl.js";
import stakingIDLJson from "../../target/idl/effect_staking.json";
import { effect_staking } from "@effectai/shared";
import { BN } from "bn.js";
import { useBankRunProvider } from "../helpers.js";
import { AccountLayout } from "@solana/spl-token";
import type { EffectVesting } from "../../target/types/effect_vesting.js";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import {
	useDeriveRewardAccounts,
	useDeriveStakeAccounts,
	useDeriveStakingRewardAccount,
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

			const { stakeAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});

			const stakeAccountData = await program.account.stakeAccount.fetch(
				stakeAccount.publicKey,
			);

			// expect to have a stake account
			expect(stakeAccountData.authority.toBase58()).toEqual(
				wallet.publicKey.toBase58(),
			);
		});

		it.concurrent(
			"should fail when stake duration is below the minimum duration",
			async () => {
				const { mint, ata } = await setup({ provider, payer });
				const { DURATION_TOO_SHORT } = useErrorsIDL(effect_staking);
				const { STAKE_DURATION_MIN } = useConstantsIDL(effect_staking);

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
				const { STAKE_DURATION_MAX } = useConstantsIDL(effect_staking);
				const { DURATION_TOO_LONG } = useErrorsIDL(effect_staking);

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
				useConstantsIDL(effect_staking);

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

			const { stakeAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});

			// init reward program
			await rewardProgram.methods
				.init()
				.accounts({
					mint,
				})
				.rpc();

			// enter reward with stake account
			await rewardProgram.methods
				.enter()
				.accounts({
					stakeAccount: stakeAccount.publicKey,
				})
				.rpc();

			const vestingAccount = new anchor.web3.Keypair();

			expectAnchorError(
				async () => {
					await program.methods
						.unstake(new BN(5_000_000))
						.accounts({
							mint,
							stakeAccount: stakeAccount.publicKey,
							vestingAccount: vestingAccount.publicKey,
							recipientTokenAccount: ata,
						})
						.signers([vestingAccount])
						.rpc();
				},
				{
					code: 3011,
					name: "ACCOUNTNOTSYSTEMOWNED",
					msg: "The given account is not owned by the system program",
				},
			);
		});

		it.concurrent("should correctly unstake a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });

			const { stakeAccount, vaultAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
			});

			const { stakingRewardAccount } = useDeriveStakingRewardAccount({
				stakingAccount: stakeAccount.publicKey,
				programId: rewardProgram.programId,
			});

			// get reward account
			const rewardAccountData =
				await rewardProgram.account.rewardAccount.fetchNullable(
					stakingRewardAccount,
				);

			expect(rewardAccountData).to.be.null;

			const vestingAccount = new anchor.web3.Keypair();

			const { vestingVaultAccount } = useDeriveVestingAccounts({
				vestingAccount: vestingAccount.publicKey,
				programId: vestingProgram.programId,
			});

			await program.methods
				.unstake(new BN(5_000_000))
				.accounts({
					mint: mint,
					stakeAccount: stakeAccount.publicKey,
					vestingAccount: vestingAccount.publicKey,
					recipientTokenAccount: ata,
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
					stakeAccount: stakeAccount.publicKey,
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
					stakeAccount: stakeAccount.publicKey,
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
