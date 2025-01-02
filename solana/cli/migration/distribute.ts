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

export const distributeMigrationCommand: CommandModule<
	unknown,
	{ mint: string }
> = {
	describe: "Distributes the migration accounts based on a csv file",
	command: "distribute",
	builder: (yargs) => {
		yargs.option("mint", {
			type: "string",
			demandOption: true,
			description: "The mint address of the token to distribute",
		});
	},
	handler: async ({ mint }) => {
		const { payer, provider } = await loadProvider();
		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;

		const mintKey = new anchor.web3.PublicKey(mint);
		const sourceAta = getAssociatedTokenAddressSync(mintKey, payer.publicKey);

		const distribution = [];

		const parsedRows = csv()
			.fromFile("./cli/migration/claims.csv")
			.then(async (rows: ParsedRow[]) => {
				// wait for input from the user
				const confirmed = await askForConfirmation(
					`Distribute ${rows.length} claims on ${provider.connection.rpcEndpoint}?`,
				);

				if (!confirmed) {
					console.log(chalk.red("Aborted."));
					return;
				}

				for (const row of rows) {
					console.log(
						chalk.green(
							`Distributing ${row.claim_amount} EFFECT to ${row.account}`,
						),
					);

					const tx = await migrationProgram.methods
						.createStakeClaim(
							Buffer.from(row.account),
							new BN(row.stake_age_start_time),
							new BN(row.claim_amount),
						)
						.accounts({
							mint: mintKey,
							userTokenAccount: sourceAta,
						})
					 	.rpc();

					distribution.push({
						account: row.account,
						tx,
					});

					// save the distribution to a file
					writeFileSync(
						"./cli/migration/distribution.json",
						JSON.stringify(distribution, null, 2),
					);
				}
			});
	},
};

function askForConfirmation(question: string): Promise<boolean> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(`${question} (yes/no): `, (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
		});
	});
}
