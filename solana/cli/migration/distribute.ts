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
import { writeFileSync, readFileSync } from "fs";
import { KeyType, PublicKey } from "@wharfkit/antelope";

interface ParsedRow {
	account: string;
	foreign_key: string;
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
	{ mint: string; distribution_file?: string }
> = {
	describe: "Distributes the migration accounts based on a csv file",
	command: "distribute",
	builder: (yargs) => {
		yargs
			.option("mint", {
				type: "string",
				demandOption: true,
				description: "The mint address of the token to distribute",
			})
			.option("distribution_file", {
				type: "string",
				description: "The path to the distribution file",
			});
	},
	handler: async ({ mint, distribution_file }) => {
		const { payer, provider } = await loadProvider();
		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;

		const mintKey = new anchor.web3.PublicKey(mint);
		const sourceAta = getAssociatedTokenAddressSync(mintKey, payer.publicKey);
		let chosen_distribution_file = distribution_file;

		if (!chosen_distribution_file) {
			try {
				chosen_distribution_file = await createDistributionFile(
					"./cli/migration/claims-demo.csv",
					"./cli/migration",
				);
			} catch (e) {
				console.log(chalk.red("Error creating distribution file" , e));
				return;
			}
		}

		if (!chosen_distribution_file) {
			console.log(chalk.red("No distribution file found."));
			return;
		}

		// read the distribution file
		const rows = JSON.parse(readFileSync(chosen_distribution_file, "utf-8"));

		// wait for input from the user
		const confirmed = await askForConfirmation(
			`Distribute ${rows.length} claims on ${provider.connection.rpcEndpoint} totaling ${rows.reduce((acc, row) => acc + Number.parseFloat(row.amount), 0)} EFFECT`,
		);

		if (!confirmed) {
			console.log(chalk.red("Aborted."));
			return;
		}

		for (const row of rows) {
			console.log(
				chalk.green(
					`Distributing ${row.amount} EFFECT to ${row.foreign_key}`,
				),
			);

			const convertedPublicKey = PublicKey.from(row.foreign_key)

			const tx = await migrationProgram.methods
				.createStakeClaim(
					Buffer.from(convertedPublicKey.data.array.slice(1, 33)),
					new BN(row.stake_age),
					new BN(Number.parseFloat(row.amount) * 1_000_000),
				)
				.accounts({
					mint: mintKey,
					userTokenAccount: sourceAta,
				})
				.rpc();


			row.tx = tx;

			// save the distribution to a file
			writeFileSync(
				chosen_distribution_file,
				JSON.stringify(rows, null, 2),
			);
		}
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

const createDistributionFile = async (
	csvFilePath: string,
	outputDir: string,
): Promise<string> => {
	return new Promise((resolve, reject) => {
		csv()
			.fromFile(csvFilePath)
			.then((rows) => {
				try {
					console.log(chalk.green("Creating new distribution file..."));
					const timestamp = Math.floor(Date.now() / 1000);
					const chosen_distribution_file = `${outputDir}/distribution-${timestamp}.json`;
					const data = rows.map((row) => ({
						foreign_key: row.foreign_key,
						stake_age: row.last_claim_age,
						amount: row.claim_amount,
						tx: undefined,
						confirmed: false,
					}));
					writeFileSync(
						chosen_distribution_file,
						JSON.stringify(data, null, 2),
					);
					resolve(chosen_distribution_file); // Resolve with the file path
				} catch (error) {
					reject(error); // Reject if there's an error
				}
			})
			.catch(reject); // Catch CSV parsing errors
	});
};
