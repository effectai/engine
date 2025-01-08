import { describe, expect, it } from "vitest";
import { createVesting } from "../../utils/vesting";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { mintToAccount, setup } from "../../utils/spl";
import { SECONDS_PER_DAY, useAnchor } from "../helpers";
import type { EffectVesting } from "../../target/types/effect_vesting";
import { useErrorsIDL } from "../../utils/idl";

describe("Vesting Program", async () => {
	const program = anchor.workspace.EffectVesting as Program<EffectVesting>;
	const { provider, payer, expectAnchorError } = useAnchor();

	it.concurrent("should initialize the vesting program", async () => {
		const { mint, ata } = await setup({ provider, payer });

		const yesterday = new Date().getTime() / 1000 - SECONDS_PER_DAY;

		// create a new vesting stream
		const { vestingAccount } = await createVesting({
			startTime: yesterday,
			releaseRate: 1_000_000,
			tag: "v",
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

	it.concurrent("cannot prematurely close a vesting stream", async () => {
		const { mint, ata } = await setup({ provider, payer });
		const {NOT_CLOSEABLE} = useErrorsIDL(program.idl)

		const yesterday = new Date().getTime() / 1000 - SECONDS_PER_DAY;

		// create a new vesting stream
		const { vestingAccount, vestingVaultAccount } = await createVesting({
			startTime: yesterday,
			releaseRate: 1_000_000,
			tag: "v",
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

		await expectAnchorError(async () => {
			await program.methods.close().accounts({
				vestingAccount: vestingAccount.publicKey,
				recipientTokenAccount: ata,
			}).rpc();
		}, NOT_CLOSEABLE);
	})


	it.concurrent("should claim a vesting stream", async () => {
		const { mint, ata } = await setup({ provider, payer });

		const now = new Date().getTime() / 1000 - SECONDS_PER_DAY;

		// create a new vesting stream
		const { vestingAccount, vestingVaultAccount } = await createVesting({
			startTime: now,
			releaseRate: 1_000_000,
			tag: "v",
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

	it.concurrent('should fail to claim a vesting stream before the start time', async () => {
		const { mint, ata } = await setup({ provider, payer });
		const {NOT_STARTED} = useErrorsIDL(program.idl)

		const tomorrow = new Date().getTime() / 1000 + SECONDS_PER_DAY;

		// create a new vesting stream
		const { vestingAccount, vestingVaultAccount } = await createVesting({
			startTime: tomorrow,
			releaseRate: 1_000_000,
			tag: "v",
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

		await expectAnchorError(async () => {
			await program.methods
				.claim()
				.accounts({
					vestingAccount: vestingAccount.publicKey,
				})
				.rpc();
		}, NOT_STARTED);
	});
});
