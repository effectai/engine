import { Connection, type PublicKey } from "@solana/web3.js";
import type { GlobalSetupContext } from "vitest/node";
import { setup as setupAccounts } from "../utils/spl.js";
import * as anchor from "@coral-xyz/anchor";

export default async function setup({ provide }: GlobalSetupContext) {
	const provider = anchor.AnchorProvider.env();
	const wallet = provider.wallet;
	const payer = (wallet as anchor.Wallet).payer;

	// const { mint, ata } = await setupAccounts(payer, provider.connection);

	// provide("tokenMint", mint.toBase58());
	// provide("tokenAccount", ata.toBase58());
}

declare module "vitest" {
	export interface ProvidedContext {
		tokenMint: string;
        tokenAccount: string;
	}
}
