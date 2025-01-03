import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
const csv = require("csvtojson");

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

		const data = await migrationProgram.account.migrationAccount.fetch(new PublicKey("GneurrJ9hyJYnw1662sUWGfBhBTYsiv2yvqo1ds7SjGp"));
		
		console.log(data)
	},
};