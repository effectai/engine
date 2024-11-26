import { type Keypair, PublicKey } from "@solana/web3.js";
import { expect, inject } from "vitest";
import * as anchor from "@coral-xyz/anchor";

import { type Idl, Program } from "@coral-xyz/anchor";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import {
	createStakeAccountAndUnstake,
	initializeVaultAccount,
} from "../utils/anchor.js";
import { setup } from "../utils/spl.js";
import stakingIDLJson from "../target/idl/effect_staking.json";
import { Clock } from "solana-bankrun";
import { toBytes } from "viem";
import { deriveMetadataAndVaultFromPublicKey } from "@effectai/utils";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration.js";


export const useTestContext = () => {
	const mint = new PublicKey(inject("tokenMint"));
	const ata = new PublicKey(inject("tokenAccount"));

	return { mint, ata };
};



export const useMigrationTestHelpers = (program: Program<SolanaSnapshotMigration>) => {
	const createMigrationAccount = async ({
		publicKey,
		mint,
		payer,
		payerTokens,
		stakeStartTime,
		amount,
	}: {
		publicKey: Uint8Array;
		mint: PublicKey;
		payer: Keypair;
		payerTokens: PublicKey;
		stakeStartTime?: number;
		amount?: number;
	}) => {

		const { metadata, vault } = deriveMetadataAndVaultFromPublicKey({
			payer: payer.publicKey,
			mint,
			foreignPubKey: publicKey,
			programId: program.programId,
			stakeStartTime: stakeStartTime || 0
		});

		await initializeVaultAccount({
			foreignPubKey: publicKey,
			mint,
			payer,
			metadata,
			payerTokens,
			amount: amount || 5000000,
			stakeStartTime
		});

		return { metadata, vault }
	};

	return { createMigrationAccount };
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

	const createStakeAndImmediatelyUnstake = async ({
		amount,
		unstakeDuration,
	}: {
		amount: number;
		unstakeDuration: number;
	}) => {
		const { mint, ata } = await setup({
			payer: provider.wallet.payer,
			provider: provider,
			amount,
		});

		const { stakeAccount, vaultAccount } = await createStakeAccountAndUnstake({
			amount,
			unstakeDuration,
			mint,
			ata,
			payer: provider.wallet.payer,
			provider: provider,
			program,
		});

		return {
			stakeAccount,
			vaultAccount,
			context,
			ata,
			mint,
			program,
			provider,
		};
	};

	return {
		provider,
		program,
		context,
		createStakeAndImmediatelyUnstake,
		useTimeTravel,
	};
};
