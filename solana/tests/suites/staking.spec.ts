import { describe, expect, it } from "vitest";
import { useAnchor } from "../helpers.js";
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
import { useDeriveRewardAccounts, useDeriveStakeAccounts, useDeriveVestingAccounts } from "../../utils/anchor.js";
import type { EffectVesting } from "../../target/types/effect_vesting.js";
import type { EffectRewards } from "../../target/types/effect_rewards.js";

const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Staking Program", async () => {
	const idl = stakingIDLJson as EffectStaking;
	const program = anchor.workspace.EffectStaking as Program<EffectStaking>;
	const vestingProgram = anchor.workspace.EffectVesting as Program<EffectVesting>;
	const rewardProgram = anchor.workspace.EffectRewards as Program<EffectRewards>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();

	describe("Stake Initialize", async () => {
		it.concurrent("should correctly initialize a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });
			await program.methods
				.stake(new anchor.BN(100), new anchor.BN(14 * SECONDS_PER_DAY))
				.accounts({
					authority: wallet.publicKey,
					userTokenAccount: ata,
					mint: mint,
				})
				.rpc();
		});

		it.concurrent(
			"should fail when stake duration is below the minimum duration",
			async () => {
				const { mint, ata } = await setup({ provider, payer });
				const { DURATION_TOO_SHORT } = useErrorsIDL(stakingIdl);
				const { STAKE_DURATION_MIN } = useConstantsIDL(stakingIdl);

				await expectAnchorError(async () => {
					await program.methods
						.stake(new anchor.BN(500), STAKE_DURATION_MIN.sub(new anchor.BN(1)))
						.accounts({
							authority: wallet.publicKey,
							userTokenAccount: ata,
							mint: mint,
						})
						.rpc();
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
					await program.methods
						.stake(new anchor.BN(100), STAKE_DURATION_MAX.add(new anchor.BN(1)))
						.accounts({
							userTokenAccount: ata,
							authority: wallet.publicKey,
							mint: mint,
						})
						.rpc();
				}, DURATION_TOO_LONG);
			},
		);

		it.concurrent("should correctly stake the minimum amount", async () => {
			const { mint, ata } = await setup({ payer, provider });
			const { STAKE_MINIMUM_AMOUNT, STAKE_DURATION_MIN } =
				useConstantsIDL(stakingIdl);

			await program.methods
				.stake(new BN(STAKE_MINIMUM_AMOUNT), STAKE_DURATION_MIN)
				.accounts({
					authority: wallet.publicKey,
					userTokenAccount: ata,
					mint: mint,
				})
				.rpc();
		});
	});

	describe("Stake Unstake", async () => {
		it.concurrent("should correctly unstake a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });

			await program.methods
				.stake(new anchor.BN(10_000_000), new anchor.BN(14 * SECONDS_PER_DAY))
				.accounts({
					authority: wallet.publicKey,
					userTokenAccount: ata,
					mint: mint,
				})
				.rpc();

			const { stakeAccount, vaultAccount: stakeVaultAccount } = useDeriveStakeAccounts({
				mint,
				authority: wallet.publicKey,
				programId: program.programId,
			});

			const vestingAccount = new anchor.web3.Keypair();

			const {vestingVaultAccount} = useDeriveVestingAccounts({
				vestingAccount: vestingAccount.publicKey,
				authority: wallet.publicKey,
				programId: vestingProgram.programId,
			})

			const {rewardAccount} = useDeriveRewardAccounts({
				authority: wallet.publicKey,
				programId: rewardProgram.programId,
			})

			await program.methods.unstake(new BN(5_000_000)).accounts({
				stake: stakeAccount,
				mint,
				vaultTokenAccount: stakeVaultAccount,
				vestingAccountUnchecked: vestingAccount.publicKey,
				vestingAccount: vestingAccount.publicKey,
				recipientTokenAccount: ata,
				rewardAccount,
				vestingVaultAccount: vestingVaultAccount,
			}).signers([vestingAccount]).rpc();

			// expect to have a vesting account
			const vestingAccountData = await vestingProgram.account.vestingAccount.fetch(vestingAccount.publicKey);
			expect(vestingAccountData).to.be.not.null;

			// expect to have balance in the vesting vault account
			const vestingVaultAccountData = await provider.connection.getTokenAccountBalance(vestingVaultAccount);
			expect(vestingVaultAccountData.value.uiAmount).toBe(5);
		});
	})

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
				amount: 5000,
			});

			await bankrunProgram.methods
				.stake(new BN(100), new BN(14 * SECONDS_PER_DAY))
				.accounts({
					authority: provider.wallet.payer.publicKey,
					userTokenAccount: ata,
					mint,
				})
				.rpc();

			// get stake account
			const { stakeAccount, vaultAccount } = useDeriveStakeAccounts({
				mint,
				authority: provider.wallet.payer.publicKey,
				programId: program.programId,
			});

			// fetch stake account
			const account =
				await bankrunProgram.account.stakeAccount.fetch(stakeAccount);

			// wait 5 days
			await useTimeTravel(100);

			// expect stake age to be 100 days
			await bankrunProgram.methods
				.topup(new BN(100))
				.accounts({
					userTokenAccount: ata,
					stake: stakeAccount,
				})
				.rpc();

			// fetch stake account
			const account2 =
				await bankrunProgram.account.stakeAccount.fetch(stakeAccount);
			console.log(new Date(account2.timeStake.toNumber() * 1000));

			const balance = await provider.connection.getAccountInfo(vaultAccount);
			if (!balance) throw new Error("Balance not found");
			const result = AccountLayout.decode(balance.data);
			expect(result.amount).toBe(200n);
		});
	});
	// describe("Stake Restake", async () => {});

});
