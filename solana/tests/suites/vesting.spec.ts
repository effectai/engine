import { describe, expect, it } from "vitest";
import { createVesting } from "../../utils/vesting";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { mintToAccount, setup } from "../../utils/spl";
import { SECONDS_PER_DAY, useAnchor } from "../helpers";
import type { EffectVesting } from "../../target/types/effect_vesting";
import { useErrorsIDL } from "../../utils/idl";
import { effect_vesting } from "@effectai/shared";

describe("Vesting Program", async () => {
	const program = anchor.workspace.EffectVesting as Program<EffectVesting>;
	const { provider, payer, expectAnchorError } = useAnchor();

	it("should initialize the vesting program", async () => {
		const { mint, ata } = await setup({ provider, payer });

		const yesterday = new Date().getTime() / 1000 - SECONDS_PER_DAY;

		// create a new vesting stream
		const { vestingAccount, vestingVaultAccount } = await createVesting({
			startTime: yesterday,
			releaseRate: 1_000_000,
			tag: "v",
			isRestrictedClaim: false,
			isClosable: false,
			amount: 1_000_000,
			mint,
			payer,
			recipientTokenAccount: ata,
			program: program,
		});

		// get accounts
		const accounts = await program.account.vestingAccount.fetch(
			vestingAccount.publicKey,
		);
		expect(accounts.authority).toEqual(payer.publicKey);
		expect(accounts.recipientTokenAccount).toEqual(ata);
	});

	it("requires the right authority to claim a restricted vesting", async () => {
		const { mint, ata } = await setup({ provider, payer });

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
			recipientTokenAccount: ata,
			program: program,
		});

		// transfer the authority to someone else
		const newAuthority = new anchor.web3.Keypair();
		await program.methods
			.updateAuthority()
			.accounts({
				newAuthority: newAuthority.publicKey,
				vestingAccount: vestingAccount.publicKey,
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

		const { UNAUTHORIZED } = useErrorsIDL(effect_vesting);

		expectAnchorError(async () => {
			await program.methods
				.claim()
				.accounts({
					vestingAccount: vestingAccount.publicKey,
				})
				.rpc();
		}, UNAUTHORIZED);
	});

	it("should claim a vesting stream", async () => {
		const { mint, ata } = await setup({ provider, payer });

		const now = new Date().getTime() / 1000 - SECONDS_PER_DAY;

		// create a new vesting stream
		const { vestingAccount, vestingVaultAccount } = await createVesting({
			startTime: now,
			releaseRate: 1_000_000,
			tag: "v",
			isRestrictedClaim: false,
			isClosable: false,
			amount: 1_000_000,
			mint,
			payer,
			recipientTokenAccount: ata,
			program: program,
		});

		// fund the vesting account
		await mintToAccount({
			mint,
			mintAuthority: payer,
			amount: 1_000_000,
			destination: vestingVaultAccount,
			payer,
			provider,
		});

		// claim
		await program.methods
			.claim()
			.accounts({
				vestingAccount: vestingAccount.publicKey,
			})
			.rpc();
	});
});
