import { PublicKey } from "@solana/web3.js";
import { expect, inject } from "vitest";
import * as anchor from "@coral-xyz/anchor";

export const useTestContext = () => {
	const mint = new PublicKey(inject("tokenMint"));
	const ata = new PublicKey(inject("tokenAccount"));

	return { mint, ata };
};

type AnchorErrorIdl = {
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
				expect(e.error.errorCode.code.toUpperCase()).toBe(expectedAnchorError.name.toUpperCase());
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
