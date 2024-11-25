import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration.js";
import { type Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import type { EffectStaking } from "../target/types/effect_staking.js";
import { useConstantsIDL } from "./idl.js";
import { stakingIdl } from "../constants/staking-idl.js";
import { expect } from "vitest";

export const useDeriveStakeAccounts = ({
	mint,
	authority,
	programId
}: {
	mint: PublicKey;
	authority: PublicKey;
	programId: PublicKey;
}) => {
	const [stakeAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("stake"), mint.toBuffer(), authority.toBuffer()],
		programId,
	);

	const [vaultAccount] = PublicKey.findProgramAddressSync(
		[stakeAccount.toBuffer()],
		programId,
	);

	return {
		stakeAccount,
		vaultAccount
	};
};

export const initializeVaultAccount = async ({
	foreignPubKey,
	mint,
	metadata,
	amount,
	payer,
	payerTokens,
	stakeStartTime
}: {
	foreignPubKey: Uint8Array;
	mint: PublicKey;
	amount: number;
	metadata: PublicKey;
	payerTokens: PublicKey;
	payer: Keypair;
	stakeStartTime?: number;
}) => {
	const program = anchor.workspace
		.SolanaSnapshotMigration as Program<SolanaSnapshotMigration>;

	console.log(foreignPubKey);

	await program.methods
		.create(Buffer.from(foreignPubKey), new BN(stakeStartTime || 0), new BN(amount))
		.accounts({
			payer: payer.publicKey,
			payerTokens,
			metadata,
			mint,
		})
		.signers([payer])
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
			stakerTokens: ata,
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
		.unstake()
		.accounts({
			stake: stakeAccount,
		})
		.rpc();

	// retrieve staking account
	const stakingAccount = await program.account.stakeAccount.fetch(stakeAccount);
	
	console.log(stakingAccount)

	return { stakeAccount, vaultAccount };
};
