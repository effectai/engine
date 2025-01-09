import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import chalk from "chalk";
import { writeFileSync, readFileSync } from "fs";
import { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import {
	extractEosPublicKeyBytes,
	useDeriveMigrationAccounts,
} from "@effectai/utils";
import { toBytes } from "viem";

export const confirmMigrationCommand: CommandModule<
	unknown,
	{ distribution_file: string, mint: string }
> = {
	describe: "Distributes the migration accounts based on a csv file",
	command: "confirm",
	builder: (yargs) => {
		yargs
			.option("mint", {
				type: "string",
				demandOption: true,
				description: "The mint address of the token to distribute",
			})
			.option("distribution_file", {
				demandOption: true,
				type: "string",
				description: "The path to the distribution file",
			});
	},
	handler: async ({ mint, distribution_file }) => {
		const { provider } = await loadProvider();

		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;

		const delay = 1000 / 5; // 1 TPS

		const rows = JSON.parse(readFileSync(distribution_file, "utf-8"));

		for (const row of rows.filter((row) => row.status === 0 || row.status === 1)) {
			console.log(`Checking ${row.foreign_key}`);

			const result = await checkMigrationAccount(
				row.foreign_key,
				migrationProgram,
				new SolanaPublicKey(mint),
			);

			if (result) {
				row.status = 2; // confirmed
				console.log(chalk.green(`Account ${row.foreign_key} found`));
			} else {
				row.status = 0; // not found
				console.log(chalk.red(`Account ${row.foreign_key} not found`));
			}

			// write
			writeFileSync(distribution_file, JSON.stringify(rows, null, 2));

			// wait 1 second
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	},
};

const checkMigrationAccount = async (
	foreignKey: string,
	migrationProgram: anchor.Program<EffectMigration>,
	mint: SolanaPublicKey,
) => {
	const foreignKeyBytes = foreignKey.startsWith("0x")
		? toBytes(foreignKey)
		: extractEosPublicKeyBytes(foreignKey);

	if (!foreignKeyBytes) return false;

	const { migrationAccount } = useDeriveMigrationAccounts({
		mint,
		foreignAddress: foreignKeyBytes,
		programId: migrationProgram.programId,
	});

	const accountData =
		await migrationProgram.account.migrationAccount.fetchNullable(
			migrationAccount,
		);

	return !!accountData;
};
