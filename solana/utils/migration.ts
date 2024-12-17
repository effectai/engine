import {
	Keypair,
	type PublicKey,
	SystemProgram,
	SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { useDeriveMigrationAccounts, useDeriveStakeAccounts } from "@effectai/utils";
import type { EffectMigration } from "../target/types/effect_migration";
import { EffectStaking } from "../target/types/effect_staking";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const SECONDS_PER_DAY = 24 * 60 * 60;

export const claimMigration = async ({
	migrationProgram,
	stakeProgram,
	ata,
	stake,
	mint,
	payer,
	signature,
	foreignPublicKey,
	message
}: {
	migrationProgram: anchor.Program<EffectMigration>;
	stakeProgram: anchor.Program<EffectStaking>;
	ata: PublicKey;
	stake: PublicKey;
	mint: PublicKey;
	payer: Keypair;
	signature: Uint8Array;
	foreignPublicKey: Uint8Array;
	message: Uint8Array;
}) => {
	const stakeAccount = stake || new anchor.web3.Keypair();
	const { vaultAccount: stakeVaultAccount } = useDeriveStakeAccounts({
		stakingAccount: stakeAccount.publicKey,
		programId: stakeProgram.programId,
	});

	// derive the migration account from the mint + foreignPublicKey
	const { migrationAccount, vaultAccount } = useDeriveMigrationAccounts({
		mint,
		foreignPublicKey,
		programId: migrationProgram.programId,
	});

    const [signers, preInsts] = stake ?  [[], []] :
	[stakeAccount,
	[await stakeProgram.methods
	.stake(new BN(0), new BN(30 * SECONDS_PER_DAY))
	.accounts({
		stakeAccount: stakeAccount.publicKey,
		authority: payer.publicKey,
		userTokenAccount: ata,
		mint,
	})
	.signers([stakeAccount])
	.instruction()]]

	let res = await migrationProgram.methods
	.claimStake(Buffer.from(signature), Buffer.from(message))
	.preInstructions([...preInsts ])
	.accountsPartial({
		authority: payer.publicKey,
		recipientTokenAccount: ata,
		stakeAccount: stakeAccount.publicKey,
		mint,
       		migrationAccount,
       		migrationVaultTokenAccount: vaultAccount,
		rent: SYSVAR_RENT_PUBKEY,
		stakeVaultTokenAccount: stakeVaultAccount,
		migrationProgram: migrationProgram.programId,
		tokenProgram: TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
		stakingProgram: stakeProgram.programId
	})
	.signers(signers)
	.rpc();

	return {stakeAccount, stakeVaultAccount, migrationAccount};
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
