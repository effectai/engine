import { Keypair, type PublicKey } from "@solana/web3.js";
import type * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { useDeriveMigrationAccounts } from "@effectai/utils";
import type { EffectMigration } from "../target/types/effect_migration";

export const createMigrationClaim = async <
	StakeType extends "token" | "stake",
>({
	type,
	publicKey,
	mint,
	payer,
	payerTokens,
	amount,
	program,
	stakeStartTime,
}: {
	type: StakeType;
	publicKey: Uint8Array;
	mint: PublicKey;
	payer: Keypair;
	payerTokens: PublicKey;
	program: anchor.Program<EffectMigration>;
	amount: number;
	stakeStartTime?: StakeType extends "stake" ? number : never;
}) => {
	const claimAccount = new Keypair();

	if (type === "token") {
		await program.methods
			.createTokenClaim(Buffer.from(publicKey), new BN(amount))
			.accounts({
				claimAccount: claimAccount.publicKey,
				payer: payer.publicKey,
				payerTokens,
				mint,
			})
			.signers([payer, claimAccount])
			.rpc();
	} else {
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
				claimAccount: claimAccount.publicKey,
				payer: payer.publicKey,
				payerTokens,
				mint,
			})
			.signers([payer, claimAccount])
			.rpc();
	}

	const { vaultAccount } = useDeriveMigrationAccounts({
		claimAccount: claimAccount.publicKey,
		programId: program.programId,
	});

	return { claimAccount: claimAccount.publicKey, vaultAccount };
};
