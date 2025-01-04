import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { extractEosPublicKeyBytes } from "@effectai/utils";
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

		const data = await migrationProgram.account.migrationAccount.fetch(new PublicKey("HHff83VXaS6sm3MqNULro6YWbcvjR78LUu6Q3ee6zVid"));
		

		const pkBytes = extractEosPublicKeyBytes("EOS64vP1Y18ZJXP7KSGoQG8pgR3imaAWoBhzH77kYmYXuVnwzGaDf")
		console.log(pkBytes)

		console.log(data.foreignAddress)
		console.log(data.stakeStartTime.toNumber())
	},
};