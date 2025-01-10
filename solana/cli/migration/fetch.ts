import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";

import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { extractEosPublicKeyBytes, useDeriveMigrationAccounts } from "@effectai/utils";
import { EffectMigrationIdl } from "@effectai/shared";
import { toBytes } from "viem";
const csv = require("csvtojson");

export const fetchMigrationAccount: CommandModule<
	unknown,
	{ mint: string }
> = {
	describe: "Distributes the migration accounts based on a csv file",
	command: "fetch",
	handler: async () => {
		const { payer, provider } = await loadProvider();
		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;


		const {migrationAccount} = useDeriveMigrationAccounts({
			foreignAddress: toBytes("0xc94e55f616fc144087093ada3924b4af5ee4d5cf"),
			mint: new PublicKey("EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E"),
			programId: migrationProgram.programId,
		})

		console.log(migrationAccount.toBase58())

		//   convert bytes to eos public KEy
	},
};