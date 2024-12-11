import { beforeAll, describe, expect, it } from "vitest";
import { useAnchor } from "../helpers.js";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectRewards } from "../../target/types/effect_rewards.js";
import { mintToAccount, setup } from "../../utils/spl.js";
import {
	useDeriveRewardAccounts,
} from "@effectai/utils";
import { createVesting } from "../../utils/vesting.js";
import type { EffectVesting } from "../../target/types/effect_vesting.js";
import { PublicKey } from "@solana/web3.js";
const SECONDS_PER_DAY = 24 * 60 * 60;

describe("Effect Reward Program", async () => {
	const program = anchor.workspace.EffectRewards as Program<EffectRewards>;
	const vestingProgram = anchor.workspace
		.EffectVesting as Program<EffectVesting>;
	const { provider, payer } = useAnchor();

	beforeAll(async () => {
		it("should correctly initialize a reflection", async () => {
			await program.methods.init().signers([payer]).rpc();
		});
	});

	describe("Reward Initialize", async () => {
		it.concurrent("should correctly claim a vesting stream", async () => {
			const { mint } = await setup({ provider, payer });

			await program.methods.init().accounts({
				mint
			}).signers([payer]).rpc();

			const { reflectionAccount, reflectionVaultAccount } = useDeriveRewardAccounts({
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
				isPubliclyClaimable: false,
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
					vaultTokenAccount: vestingVaultAccount,
					rewardVaultTokenAccount: reflectionVaultAccount,
					reflection: reflectionAccount,
				})
				.rpc();

			const reflectionAccountData =
				await program.account.reflectionAccount.fetch(reflectionAccount);
			const reflectionVaultAccountBalance =
				await program.provider.connection.getTokenAccountBalance(
					reflectionVaultAccount,
				);

			expect(reflectionAccountData.totalWeightedAmount.toNumber()).toEqual(1000_000_000);
			expect(reflectionVaultAccountBalance.value.uiAmount).toEqual(1000);
		});
	});
});
