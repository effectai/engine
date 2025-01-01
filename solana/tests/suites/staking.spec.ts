import { beforeAll, describe, expect, it } from "vitest";
import { SECONDS_PER_DAY, useAnchor, useStakeTestHelpers } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectStaking } from "../../target/types/effect_staking.js";
import { createTokenAccount, mintToAccount, setup } from "../../utils/spl.js";
import { useConstantsIDL, useErrorsIDL } from "../../utils/idl.js";
import stakingIDLJson from "../../target/idl/effect_staking.json";
import { effect_staking } from "@effectai/shared";
import { BN, min } from "bn.js";
import { useBankRunProvider } from "../helpers.js";
import { AccountLayout, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { EffectVesting } from "../../target/types/effect_vesting.js";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import {
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
				amount: 5_000_000,
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
						amount: 5_000_000,
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
						amount: 5_000_000,
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
		it.concurrent('cannot unstake someone else\'s stake account', async () => {
			const { mint, ata } = await setup({ payer, provider });
			const { UNAUTHORIZED } = useErrorsIDL(effect_staking);

			const stakeAccount = new anchor.web3.Keypair();
			const stakeAuthority = new anchor.web3.Keypair();
			const stakeAuthAta = getAssociatedTokenAddressSync(
				mint, 
				stakeAuthority.publicKey
			)
			// airdrop some sol to authority
			const tx = await provider.connection.requestAirdrop(stakeAuthority.publicKey, 3000000000);

			// wait for the airdrop to confirm
			await provider.connection.confirmTransaction(tx);

			await createTokenAccount({provider, mint, owner: stakeAuthority.publicKey, payer:stakeAuthority});

			// send 5 tokens to the authority
			await mintToAccount({
				mint,
				mintAuthority: payer,
				amount: 5_000_000,
				destination: stakeAuthAta,
				payer: payer,
				provider: provider,
			})

			await program.methods
			.stake(new BN(5_000_000), new BN(30 * SECONDS_PER_DAY))
			.accounts({
				mint,
				authority: stakeAuthority.publicKey,
				stakeAccount: stakeAccount.publicKey,
				userTokenAccount: stakeAuthAta,
			})
			.signers([stakeAuthority, stakeAccount])
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
							recipientTokenAccount: stakeAuthAta,
						})
						.signers([vestingAccount])
						.rpc();
				},
				UNAUTHORIZED
			);
		});

		it.concurrent("cannot unstake with an open reward account", async () => {
			const { mint, ata } = await setup({ payer, provider });

			const { stakeAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
				amount: 5_000_000,
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
					mint,
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

			const { stakeAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
				amount: 5_000_000,
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
		it.concurrent('dilutes stake age when "topup" is called', async () => {
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

	describe("Stake Close", async () => {
		it.concurrent("should correctly close a stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });
			
			const { stakeAccount, vaultAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
				amount: 0
			});

			const stakeAccountData = await program.account.stakeAccount.fetch(stakeAccount.publicKey);
			const stakeVaultAccountBalance = await provider.connection.getTokenAccountBalance(vaultAccount);

			expect(stakeAccountData.authority.toBase58()).toEqual(wallet.publicKey.toBase58());
			expect(stakeAccountData.amount.toNumber()).toEqual(0);
			expect(stakeVaultAccountBalance.value.uiAmount).toEqual(0);

			await program.methods.close().accounts({
				stakeAccount: stakeAccount.publicKey,
				recipientTokenAccount: ata,
			}).rpc();
		});

		it.concurrent("should throw STAKE_NOT_EMPTY error on closing a non-empty stake account", async () => {
			const { mint, ata } = await setup({ payer, provider });
			const { STAKE_NOT_EMPTY } = useErrorsIDL(effect_staking);

			const { stakeAccount } = await useCreateStake({
				authority: wallet.publicKey,
				mint,
				userTokenAccount: ata,
				amount: 5_000_000,
			});

			expectAnchorError(
				async () => {
					await program.methods.close().accounts({
						stakeAccount: stakeAccount.publicKey,
						recipientTokenAccount: ata,
					}).rpc()
				},
				STAKE_NOT_EMPTY
			);
		});

		
	});
});
