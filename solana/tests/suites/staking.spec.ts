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
import { useDeriveStakeAccounts } from "../../utils/anchor.js";

const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Staking Program", async () => {
	const program = anchor.workspace.EffectStaking as Program<EffectStaking>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();

	describe("Stake Initialize", async () => {
		it.concurrent("should correctly initialize a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });
			await program.methods
				.stake(new anchor.BN(100), new anchor.BN(14 * SECONDS_PER_DAY))
				.accounts({
					authority: wallet.publicKey,
					stakerTokens: ata,
					mint: mint,
				})
				.rpc();
		});

		it.concurrent(
			"should fail when stake duration is below the minimum duration",
			async () => {
				const { mint, ata } = await setup({ provider, payer });
				const { DURATION_TOO_SHORT } = useErrorsIDL(stakingIdl);
				const { DURATION_MIN } = useConstantsIDL(stakingIdl);

				await expectAnchorError(async () => {
					await program.methods
						.stake(new anchor.BN(500), DURATION_MIN.sub(new anchor.BN(1)))
						.accounts({
							authority: wallet.publicKey,
							stakerTokens: ata,
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
				const { DURATION_MAX } = useConstantsIDL(stakingIdl);
				const { DURATION_TOO_LONG } = useErrorsIDL(stakingIdl);

				await expectAnchorError(async () => {
					await program.methods
						.stake(new anchor.BN(100), DURATION_MAX.add(new anchor.BN(1)))
						.accounts({
							authority: wallet.publicKey,
							stakerTokens: ata,
							mint: mint,
						})
						.rpc();
				}, DURATION_TOO_LONG);
			},
		);

		it.concurrent("should correctly stake the minimum amount", async () => {
			const { mint, ata } = await setup({ payer, provider });
			const { STAKE_MINIMUM, DURATION_MIN } = useConstantsIDL(stakingIdl);

			await program.methods
				.stake(new BN(STAKE_MINIMUM), DURATION_MIN)
				.accounts({
					authority: wallet.publicKey,
					stakerTokens: ata,
					mint: mint,
				})
				.rpc();
		});
	});

	describe("Stake Withdraw", async () => {
		const idl = stakingIDLJson as EffectStaking;

		// TODO::
		it.concurrent(
			'should fail when "withdraw" is called before "unstake"',
			async () => {},
		);

		it.concurrent("expect to have withdrawn nothing", async () => {
			const { createStakeAndImmediatelyUnstake, program: bankrunProgram } =
				await useBankRunProvider(idl);
			const { stakeAccount, ata, provider } =
				await createStakeAndImmediatelyUnstake({
					amount: 100,
					unstakeDuration: 14,
				});

			await bankrunProgram.methods
				.withdraw()
				.accounts({
					stakerTokens: ata,
					stake: stakeAccount,
				})
				.rpc();

			const balance = await provider.connection.getAccountInfo(ata);
			if (!balance) throw new Error("Balance not found");
			const result = AccountLayout.decode(balance.data);
			expect(result.amount).toBe(0n);
		});

		it.concurrent(
			"can withdraw entire balance after unstake duration",
			async () => {
				const {
					createStakeAndImmediatelyUnstake,
					useTimeTravel,
					program: bankrunProgram,
				} = await useBankRunProvider(idl);

				const { stakeAccount, ata, provider } =
					await createStakeAndImmediatelyUnstake({
						unstakeDuration: 14, //14 days
						amount: 100, // 100 tokens
					});

				// advance the clock by 14 days
				await useTimeTravel(14);

				await bankrunProgram.methods
					.withdraw()
					.accounts({
						stakerTokens: ata,
						stake: stakeAccount,
					})
					.rpc();

				const balance = await provider.connection.getAccountInfo(ata);
				if (!balance) throw new Error("Balance not found");
				const result = AccountLayout.decode(balance.data);
				expect(result.amount).toBe(100n);
			},
		);

		// describe("Stake Extension", async () => {});
		describe("Stake Topup", async () => {
			it('dilutes stake age when "topup" is called', async () => {
				const { program: bankrunProgram, provider, useTimeTravel } = await useBankRunProvider(idl);

				const { mint, ata } = await setup({
					payer: provider.wallet.payer,
					provider: provider,
					amount: 5000
				});

				await bankrunProgram.methods.stake(new BN(100), new BN(14 * SECONDS_PER_DAY)).accounts({
					authority: provider.wallet.payer.publicKey,
					stakerTokens: ata,
					mint,
				}).rpc();

				// get stake account
				const {stakeAccount,vaultAccount} = useDeriveStakeAccounts({
					mint,
					authority: provider.wallet.payer.publicKey,
					programId: program.programId,
				})

				// fetch stake account
				const account = await bankrunProgram.account.stakeAccount.fetch(stakeAccount);

				console.log(new Date(account.timeStake.toNumber() * 1000))

				// wait 5 days
				await useTimeTravel(100);

				// expect stake age to be 100 days
				await bankrunProgram.methods
					.topup(new BN(100))
					.accounts({
						stakerTokens: ata,
						stake: stakeAccount,
					})
					.rpc();

				// fetch stake account
				const account2 = await bankrunProgram.account.stakeAccount.fetch(stakeAccount);
				console.log(new Date(account2.timeStake.toNumber() * 1000))

				const balance = await provider.connection.getAccountInfo(vaultAccount);
				if (!balance) throw new Error("Balance not found");
				const result = AccountLayout.decode(balance.data);
				expect(result.amount).toBe(200n);
			});
		});
		// describe("Stake Restake", async () => {});
	});
});
