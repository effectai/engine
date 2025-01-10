import { ComputeBudgetProgram, Keypair, type PublicKey } from "@solana/web3.js";
import type * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import type { EffectVesting } from "../target/types/effect_vesting";
import { useDeriveVestingAccounts } from "@effectai/utils";

export const createVesting = async ({
	releaseRate,
	startTime,
	isClosable,
	tag,
	program,
	mint,
	payer,
	recipientTokenAccount,
}: {
	releaseRate: number;
	startTime: number;
	isClosable: boolean;
	tag: string;
	amount: number;
	program: anchor.Program<EffectVesting>;
	mint: PublicKey;
	payer: Keypair;
	recipientTokenAccount: PublicKey;
}) => {
	const vestingAccount = Keypair.generate();

	const { vestingVaultAccount } = useDeriveVestingAccounts({
		vestingAccount: vestingAccount.publicKey,
		programId: program.programId,
	})

	const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
		microLamports: 100_000,
	});

	await program.methods
		.open(
			new BN(releaseRate),
			new BN(startTime),
			isClosable,
			Array.from(tag).map((c) => c.charCodeAt(0)),
		)
		.preInstructions([
			priorityFee
		])
		.accounts({
			vestingAccount: vestingAccount.publicKey,
			authority: payer.publicKey,
			recipientTokenAccount,
			mint,
		})
		.signers([vestingAccount])
		.rpc();

	return { vestingAccount, vestingVaultAccount };
};
