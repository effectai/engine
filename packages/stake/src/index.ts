import * as anchor from "@coral-xyz/anchor";
import type { Program, Idl } from "@coral-xyz/anchor";
import { BN } from "bn.js";
import {
	ComputeBudgetProgram,
	PublicKey,
	SYSVAR_RENT_PUBKEY,
	TransactionInstruction,
	Transaction,
} from "@solana/web3.js";

import {
	createAssociatedTokenAccountIdempotentInstructionWithDerivation,
	getAccount,
	getAssociatedTokenAddress,
} from "@solana/spl-token";

import type { EffectStaking } from "./effect_staking.js";
import type { StakeClient } from "./client.js";
import { Buffer } from "buffer";

const SECONDS_PER_DAY = 24 * 60 * 60;

export const getStakeAccounts = (program: Program<EffectStaking>) => {
	return program.account.stakeAccount.all();
};

export const deriveStakingAccounts = async ({
	client,
	userAddress,
}: {
	client: StakeClient;
	userAddress: PublicKey;
}) => {
	const mint = client.config.EFFECT_SPL_TOKEN_MINT;

	const [vaultAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("vault"), mint.toBuffer(), userAddress.toBuffer()],
		client.program.programId,
	);

	const [stakeAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("stake"), mint.toBuffer(), userAddress.toBuffer()],
		client.program.programId,
	);

	return { stakeAccount, vaultAccount };
};

export const createStakeTransaction = async ({
	client,
	userAddress,
	amount,
	unstakeDays,
}: {
	client: StakeClient;
	userAddress: PublicKey;
	amount: number;
	unstakeDays: number;
}) => {
	const stakeDurationSeconds = unstakeDays * SECONDS_PER_DAY;
	const stakeAmount = amount;

	const ata = await getAssociatedTokenAddress(
		userAddress,
		client.config.EFFECT_SPL_TOKEN_MINT,
	);

	const transaction = new Transaction();
	const userATA = await client.config.connection.getAccountInfo(ata);
	if (!userATA) {
		console.log("Creating ATA");
		const ataInstruction =
			createAssociatedTokenAccountIdempotentInstructionWithDerivation(
				userAddress,
				userAddress,
				client.config.EFFECT_SPL_TOKEN_MINT,
			);
		transaction.add(ataInstruction);
	}

	const createStakeInstruction = await client.program.methods
		.stake(new BN(stakeAmount), new BN(stakeDurationSeconds))
		.accounts({ user: ata })
		.transaction();

	transaction.add(createStakeInstruction);

	return transaction;
};

export * from "./client.js";