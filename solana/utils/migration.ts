import { Keypair, type PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { useDeriveMigrationAccounts, useDeriveStakeAccounts } from "@effectai/utils";
import type { EffectMigration } from "../target/types/effect_migration";
import { EffectStaking } from "../target/types/effect_staking";

export const SECONDS_PER_DAY = 24 * 60 * 60;

export const claimMigration = async ({
	migrationProgram,
	stakeProgram,
	ata,
	mint,
	payer,
	signature,
	foreignPublicKey,
	message
}: {
	migrationProgram: anchor.Program<EffectMigration>;
	stakeProgram: anchor.Program<EffectStaking>;
	ata: PublicKey;
	mint: PublicKey;
	payer: Keypair;
	signature: Uint8Array;
	foreignPublicKey: Uint8Array;
	message: Uint8Array;
}) => {
	const stakeAccount = new anchor.web3.Keypair();

	// derive the migration account from the mint + foreignPublicKey
	const { migrationAccount } = useDeriveMigrationAccounts({
		mint,
		foreignPublicKey,
		programId: migrationProgram.programId,
	});

	await migrationProgram.methods
	.claimStake(Buffer.from(signature), Buffer.from(message), Buffer.from(foreignPublicKey))
	.preInstructions([
		...[
			await stakeProgram.methods
				.stake(new BN(0), new BN(30 * SECONDS_PER_DAY))
				.accounts({
					stakeAccount: stakeAccount.publicKey,
					authority: payer.publicKey,
					userTokenAccount: ata,
					mint,
				})
				.signers([stakeAccount])
				.instruction(),
		],
	])
	.accounts({
		recipientTokenAccount: ata,
		stakeAccount: stakeAccount.publicKey,
		mint,
	})
	.signers([stakeAccount])
	.rpc();

	// derive stakeVault
	const { vaultAccount: stakeVaultAccount } = useDeriveStakeAccounts({
		stakingAccount: stakeAccount.publicKey,
		programId: stakeProgram.programId,
	});

	return {stakeAccount, stakeVaultAccount};
}

export const createMigrationClaim = async({
	publicKey,
	mint,
	userTokenAccount,
	amount,
	program,
	stakeStartTime,
}: {
	publicKey: Uint8Array;
	mint: PublicKey;
	userTokenAccount: PublicKey;
	program: anchor.Program<EffectMigration>;
	amount: number;
	stakeStartTime: number;
}) => {
	const claimAccount = new Keypair();

	if (!stakeStartTime) {
		throw new Error("stakeStartTime is required for stake");
	}

	await program.methods
		.createStakeClaim(
			Buffer.from(publicKey),
			new BN(stakeStartTime),
			new BN(amount),
		)
		.accounts({
			userTokenAccount,
			mint,
		})
		.rpc();

	const { vaultAccount, migrationAccount } = useDeriveMigrationAccounts({
		mint,
		foreignPublicKey: publicKey,
		programId: program.programId,
	});

	return { migrationAccount, vaultAccount };
};
