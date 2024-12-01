import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Keypair, type PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import type { EffectStaking } from "../target/types/effect_staking.js";

import { useConstantsIDL } from "./idl.js";
import type { EffectMigration } from "../target/types/effect_migration.js";
import migrationIdl from "../target/idl/effect_migration.json";
import { useDeriveStakeAccounts } from "@effectai/utils";
import { expect } from "vitest";

export const createTokenClaim = async ({
	claimAccount,
	foreignPubKey,
	mint,
	amount,
	payer,
	payerTokens,
	provider,
}: {
	claimAccount: Keypair;
	foreignPubKey: Uint8Array;
	mint: PublicKey;
	amount: number;
	payerTokens: PublicKey;
	payer: Keypair;
	provider: anchor.Provider;
}) => {
	const migrationProgram = new anchor.Program(
		migrationIdl as anchor.Idl,
		provider,
	) as unknown as Program<EffectMigration>;


	await migrationProgram.methods
		.createTokenClaim(Buffer.from(foreignPubKey), new BN(amount))
		.accounts({
			claimAccount: claimAccount.publicKey,
			payer: payer.publicKey,
			payerTokens,
			mint,
		})
		.signers([payer, claimAccount])
		.rpc();
};

export const createStakeClaim = async ({
	claimAccount,
	foreignPubKey,
	mint,
	amount,
	payer,
	payerTokens,
	stakeStartTime,
	provider
}: {
	claimAccount: Keypair;
	foreignPubKey: Uint8Array;
	mint: PublicKey;
	amount: number;
	payerTokens: PublicKey;
	payer: Keypair;
	stakeStartTime: number;
	provider: anchor.Provider;
}) => {
	const migrationProgram = new anchor.Program(
		migrationIdl as anchor.Idl,
		provider,
	) as unknown as Program<EffectMigration>;

	if(!stakeStartTime) {
		throw new Error("stakeStartTime is required when creating a stake claim");
	}

	await migrationProgram.methods
		.createStakeClaim(Buffer.from(foreignPubKey), new BN(stakeStartTime), new BN(amount))
		.accounts({
			claimAccount: claimAccount.publicKey,
			payer: payer.publicKey,
			payerTokens,
			mint,
		})
		.signers([payer, claimAccount])
		.rpc();
};

export const createStakeAccountAndUnstake = async ({
	amount,
	unstakeDuration,
	program,
	mint,
	payer,
	ata,
	provider,
}: {
	amount: number;
	unstakeDuration: number;
	payer: Keypair;
	program: Program<EffectStaking>;
	mint: PublicKey;
	ata: PublicKey;
	provider: anchor.Provider;
}) => {
	await program.methods
		.stake(new BN(amount), new BN(unstakeDuration * 24 * 60 * 60))
		.accounts({
			userTokenAccount: ata,
			mint: mint,
		})
		.rpc();

	const { stakeAccount, vaultAccount } = useDeriveStakeAccounts({
		mint,
		authority: payer.publicKey,
		programId: program.programId,
	});

	// check if stakingAccount exists
	const account = await provider.connection.getAccountInfo(stakeAccount);
	expect(account).not.toBe(null);

	// check if vault exists
	const vault = await provider.connection.getAccountInfo(vaultAccount);
	expect(vault).not.toBe(null);

	await program.methods
		.unstake(new BN(amount))
		.accounts({
			stake: stakeAccount,
		})
		.rpc();

	// retrieve staking account
	const stakingAccount = await program.account.stakeAccount.fetch(stakeAccount);
	
	console.log(stakingAccount)

	return { stakeAccount, vaultAccount };
};
