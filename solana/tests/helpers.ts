import { PublicKey } from "@solana/web3.js";
import { expect, inject } from "vitest";
import * as anchor from "@coral-xyz/anchor";

import { type Idl, Program } from "@coral-xyz/anchor";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Clock } from "solana-bankrun";
import {
	useDeriveStakeAccounts
} from "@effectai/utils";
import type { EffectStaking } from "../target/types/effect_staking.js";

export const SECONDS_PER_DAY = 24 * 60 * 60;

export const useStakeTestHelpers = (program: Program<EffectStaking>) => {
	const useCreateStake = async ({
		authority,
		mint,
		userTokenAccount,
		amount,
		lockTimeInDays,
	}: {
		authority: PublicKey;
		mint: PublicKey;
		userTokenAccount: PublicKey;
		amount?: number;
		lockTimeInDays?: number;
	}) => {
		const stakeAccount = new anchor.web3.Keypair();

		await program.methods
			.stake(
				new anchor.BN(amount || 50_000_000),
				new anchor.BN(lockTimeInDays || 30 * SECONDS_PER_DAY),
			)
			.accounts({
				stake: stakeAccount.publicKey,
				authority,
				userTokenAccount,
				mint: mint,
			})
			.signers([stakeAccount])
			.rpc();

		const { vaultAccount } = useDeriveStakeAccounts({
			stakingAccount: stakeAccount.publicKey,
			programId: program.programId,
		});

		return { stakeAccount, vaultAccount };
	};

	return { useCreateStake };
};

export type AnchorErrorIdl = {
	code: number;
	name: string;
	msg: string;
};

export const useAnchor = () => {
	const provider = anchor.AnchorProvider.env();
	const wallet = provider.wallet;
	const payer = (wallet as anchor.Wallet).payer;

	const expectAnchorError = async (
		action: () => Promise<void>,
		expectedAnchorError: AnchorErrorIdl,
	): Promise<void> => {
		try {
			await action();
		} catch (e: unknown) {
			if (e instanceof anchor.AnchorError) {
				expect(e.error.errorCode.code.toUpperCase()).toBe(
					expectedAnchorError.name.toUpperCase(),
				);
				expect(e.error.errorCode.number).toBe(expectedAnchorError.code);
				expect(e.error.errorMessage).toBe(expectedAnchorError.msg);
				return;
			}
			throw e;
		}
		throw new Error("Expected an AnchorError but no error was thrown");
	};

	return { payer, provider, wallet, expectAnchorError };
};

export const useBankRunProvider = async <T extends Idl>(idl: T) => {
	const context = await startAnchor("./", [], []);
	const provider = new BankrunProvider(context);
	const program = new Program(idl, provider) as Program<T>;

	const useTimeTravel = async (days: number) => {
		const currentClock = await context.banksClient.getClock();
		context.setClock(
			new Clock(
				currentClock.slot,
				currentClock.epochStartTimestamp,
				currentClock.epoch,
				currentClock.leaderScheduleEpoch,
				BigInt(Math.floor(new Date().getTime() / 1000 + days * 24 * 60 * 60)),
			),
		);
	};

	return {
		provider,
		program,
		context,
		useTimeTravel,
	};
};
