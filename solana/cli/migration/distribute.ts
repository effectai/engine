import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";
import EffectMigrationIdl from "../../target/idl/effect_migration.json";
import * as anchor from "@coral-xyz/anchor";
import chalk from "chalk";
import { BN } from "bn.js";
import {
	createTransferCheckedInstruction,
	getAssociatedTokenAddressSync,
	transferCheckedWithFee,
} from "@solana/spl-token";
import readline from "node:readline";
import { writeFileSync, readFileSync } from "fs";
import {
	extractEosPublicKeyBytes,
	useDeriveMigrationAccounts,
} from "@effectai/utils";
import { toBytes } from "viem";
import { ComputeBudgetProgram, Transaction } from "@solana/web3.js";

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
				demandOption: true,
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

		if (!distribution_file) {
			console.log(chalk.red("No distribution file found."));
			return;
		}

		// read the distribution file
		const rows: DistributionRow[] = JSON.parse(
			readFileSync(distribution_file, "utf-8"),
		);

		const claimsLeft = rows.filter((r) => r.status === 0);

		// wait for input from the user
		const confirmed = await askForConfirmation(
			`Distribute (${claimsLeft.length}/${rows.length}) claims on ${provider.connection.rpcEndpoint} totalling ${(claimsLeft.reduce((acc, row) => acc + Number.parseFloat(row.amount), 0)).toFixed(2)}/${balance.value.uiAmount} EFFECT`,
		);

		if (!confirmed) {
			console.log(chalk.red("Aborted."));
			return;
		}

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

			if(!row.stake_age) {
				console.log(
					chalk.red(
						`Error distributing ${row.amount} EFFECT to ${row.foreign_key} (INVALID STAKE_AGE)`,
					),
				);
				continue;
			}

			const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
				microLamports: 50_000,
			});

			try {
				const tx = await migrationProgram.methods
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
					.rpc();

				row.status = 2;
				row.tx = tx;
				writeFileSync(distribution_file, JSON.stringify(rows, null, 2));
			} catch (e: unknown) {
				if (e instanceof Error) {
					if (e.message.includes("0x0") && e.message.includes("Instruction: CreateStakeClaim") && e.message.includes("already in use")) {
						console.log(
							chalk.red(
								`Error distributing ${row.amount} EFFECT to ${row.foreign_key} (ALREADY EXISTS)`,
							),
						);

						// ask to do a topup instead
						const confirmed = await askForConfirmation(
							`Do you want to topup ${row.foreign_key} with ${row.amount} EFFECT?`,
						);

						if (confirmed) {
							const { vaultAccount } = useDeriveMigrationAccounts({
								mint: mintKey,
								foreignAddress: foreignKeyBytes,
								programId: migrationProgram.programId,
							});

							console.log(
								`Topping up ${vaultAccount.toBase58()} with ${row.amount} EFFECT...`,
							);

							const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
								microLamports: 100_000,
							});

							try {
								const topupTransaction = new Transaction().add(
									priorityFee,
									createTransferCheckedInstruction(
										sourceAta,
										mintKey,
										vaultAccount,
										payer.publicKey,
										// amount
										new BN(Number.parseFloat(row.amount) * 1_000_000).toNumber(),
										// mint decimals
										6,
									),
								);

								topupTransaction.recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
								topupTransaction.feePayer = payer.publicKey;
								row.tx = await provider.sendAndConfirm(topupTransaction, [payer]);
								row.status = 3; // mark as topped up
								writeFileSync(distribution_file, JSON.stringify(rows, null, 2));
							} catch (e: unknown) {
								if (e instanceof Error) {
									if(e.message.includes("Transaction was not confirmed in")){
										const signature = extractSignatureFromMessage(e.message);
										if(signature) {
											row.tx = signature;
											row.status = 1; // mark as to be confirmed
											writeFileSync(distribution_file, JSON.stringify(rows, null, 2));
										}
									}
									console.log(
										`Error topping up ${row.foreign_key} with ${row.amount} EFFECT`,
									);
									console.log(chalk.red(e.message));
								}
							}
						}
					} else {
						console.log(
							chalk.red(
								`Error distributing ${row.amount} EFFECT to ${row.foreign_key}`,
							),
						);
						console.log(chalk.red(e.message));
					}
				}
			}
		}
	},
};

function extractSignatureFromMessage(message: string): string | null {
	// Regular expression to find a base58-like signature (e.g., Solana transaction signatures)
	const signatureRegex = /Check signature (\w+)/;
	const match = message.match(signatureRegex);
	return match ? match[1] : null;
}
  

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
