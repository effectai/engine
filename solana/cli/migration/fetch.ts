import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import chalk from "chalk";
import { BN } from "bn.js";
import {
	getAssociatedTokenAddress,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
const csv = require("csvtojson");
import readline from "node:readline";
import { writeFileSync } from "fs";
import { PublicKey } from "@solana/web3.js";
import { extractEosPublicKeyBytes } from "@effectai/utils";

interface ParsedRow {
	account: string;
	tag: string;
	last_claim_time: string;
	last_claim_age: number;
	type: string;
	efx: number;
	nfx: number;
	staked_efx: number;
	staked_nfx: number;
	claim_amount: number;
}

export const fetchMigrationAccount: CommandModule<
	unknown,
	{ mint: string }
> = {
	describe: "Distributes the migration accounts based on a csv file",
	command: "fetch",
	handler: async ({ mint }) => {
		const { payer, provider } = await loadProvider();
		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;

		const data = await migrationProgram.account.migrationAccount.fetch(new PublicKey("F671XhTLq2WAgPmy7FgMsoVmvjChKWvWZ1xziDE93vxD"));
	
		console.log(data)
	},
};