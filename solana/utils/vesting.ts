import { Keypair, type PublicKey } from "@solana/web3.js";
import type * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { SECONDS_PER_DAY } from "../tests/helpers";
import type { EffectStaking } from "../target/types/effect_staking";
import { EffectVesting } from "../target/types/effect_vesting";
import { useDeriveVestingAccounts } from "@effectai/utils";

export const createVesting = async ({
	releaseRate,
	startTime,
	isClosable,
	isRestrictedClaim,
	tag,
	program,
	mint,
	payer,
	recipientTokenAccount,
}: {
	releaseRate: number;
	startTime: number;
	isClosable: boolean;
	isRestrictedClaim: boolean;
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

	await program.methods
		.open(
			new BN(releaseRate),
			new BN(startTime),
			isClosable,
			isRestrictedClaim,
			Array.from(tag).map((c) => c.charCodeAt(0)),
		)
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
