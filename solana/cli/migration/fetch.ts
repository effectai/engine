import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { extractEosPublicKeyBytes, useDeriveMigrationAccounts } from "@effectai/utils";
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

		const mint = new PublicKey("EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E");

		// const data = await migrationProgram.account.migrationAccount.fetch(new PublicKey("HHff83VXaS6sm3MqNULro6YWbcvjR78LUu6Q3ee6zVid"));
		const pkBytes = extractEosPublicKeyBytes("EOS7b2mqiesVwbbcKYBRbyHYPZw3HhddMY9fnay4E9ww79CygexHb")
		
		if(!pkBytes) {
			console.log("Invalid public key")
			return
		}

		const { migrationAccount } = useDeriveMigrationAccounts({
			mint,
			foreignAddress: pkBytes,
			programId: migrationProgram.programId,
		})

		console.log(migrationAccount.toBase58())
	},
};