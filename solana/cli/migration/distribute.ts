import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import chalk from "chalk";
import { BN } from "bn.js";
import {
	getAssociatedTokenAddressSync
} from "@solana/spl-token";
import readline from "node:readline";
import { writeFileSync, readFileSync } from "fs";
import { extractEosPublicKeyBytes } from "@effectai/utils";
import { toBytes } from "viem";
import { ComputeBudgetProgram } from "@solana/web3.js";
const csv = require("csvtojson");

type DistributionRow = {
	foreign_key: string;
	stake_age: string;
	amount: string;
	status: number;
	tx?: string;
};

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

		// get balance 
		const balance = await provider.connection.getTokenAccountBalance(sourceAta);

		let chosen_distribution_file = distribution_file;

		if (!chosen_distribution_file) {
			try {
				chosen_distribution_file = await createDistributionFile(
					"./cli/migration/claims.csv",
					"./cli/migration",
				);
			} catch (e) {
				console.log(chalk.red("Error creating distribution file", e));
				return;
			}
		}

		if (!chosen_distribution_file) {
			console.log(chalk.red("No distribution file found."));
			return;
		}

		// read the distribution file
		const rows: DistributionRow[] = JSON.parse(readFileSync(chosen_distribution_file, "utf-8"));

		// wait for input from the user
		const claimsLeft = rows.filter((r) => r.status === 0);
		
		const confirmed = await askForConfirmation(
			`Distribute (${claimsLeft.length}/${rows.length}) claims on ${provider.connection.rpcEndpoint} totalling ${(claimsLeft.reduce((acc, row) => acc + Number.parseFloat(row.amount), 0)).toFixed(2)}/${balance.value.uiAmount} EFFECT`,
		);

		if (!confirmed) {
			console.log(chalk.red("Aborted."));
			return;
		}

		const delay = 1000 / 4.5; // 6 TPS

		for (const row of rows.filter((row: DistributionRow) => row.status === 0)) {
			console.log(
				chalk.green(`Distributing ${row.amount} EFFECT to ${row.foreign_key}`),
			);

			const foreignKeyBytes = row.foreign_key.startsWith("0x")
			? toBytes(row.foreign_key)
			: extractEosPublicKeyBytes(row.foreign_key);

			if (!foreignKeyBytes) {
				console.log(
					chalk.red(
						`Error distributing ${row.amount} EFFECT to ${row.foreign_key}`,
					),
				);
				continue;
			}

			const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
				microLamports: 20000,
			});

			migrationProgram.methods
				.createStakeClaim(
					Buffer.from(foreignKeyBytes),
					new BN(row.stake_age),
					new BN(Number.parseFloat(row.amount) * 1_000_000),
				)
				.preInstructions([addPriorityFee])
				.accounts({
					mint: mintKey,
					userTokenAccount: sourceAta,
				})
				.rpc()
				.then((tx) => {
					// Mark row as sent
					row.status = 1;
					row.tx = tx;
					writeFileSync(
						chosen_distribution_file,
						JSON.stringify(rows, null, 2),
					);
				})
				.catch((e: Error) => {
					// check if error message contains 0x0
					if (e.message.includes("0x0")) {
						console.log(
							chalk.red(
								`Error distributing ${row.amount} EFFECT to ${row.foreign_key} (ALREADY EXISTS)`,
							),
						);
						row.status = 1;
						writeFileSync(
							chosen_distribution_file,
							JSON.stringify(rows, null, 2),
						);
					} else {
						console.log(
							chalk.red(
								`Error distributing ${row.amount} EFFECT to ${row.foreign_key}`,
							),
						);
						console.log(chalk.red(e.message))
					}
				});

			// wait 100ms
			await new Promise((resolve) => setTimeout(resolve, delay));
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
						foreign_key: row.key,
						stake_age: row.stake_age_timestamp,
						amount: row.claim_amount,
						status: 0,
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
