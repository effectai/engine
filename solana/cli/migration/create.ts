import * as anchor from "@coral-xyz/anchor";
import { createMigrationClaim } from "../../utils/migration";
import { toBytes } from "viem";
import {
	createAssociatedTokenAccount,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { loadProvider } from "../../utils/provider";
import chalk from "chalk";

import type { CommandModule } from "yargs";
import {
	extractEosPublicKeyBytes,
	extractKeyFromEosUsername,
} from "@effectai/utils";
import type { EffectMigration } from "../../target/types/effect_migration";
import { EffectMigrationIdl } from "@effectai/shared";
import { askForConfirmation } from "../utils";

interface MigrationClaimOptions {
	mint: string;
	publicKey: string;
	amount: number;
	stakeStartTime: number;
	username?: string;
}

export const createMigrationClaimCommand: CommandModule<
	unknown,
	MigrationClaimOptions
> = {
	command: "create",
	describe: "Create a new migration claim",
	builder: (yargs) =>
		yargs
			.option("username", {
				type: "string",
				description: "The username of the account to be migrated",
			})
			.option("publicKey", {
				type: "string",
				description: "The public key of the account to be migrated",
			})
			.option("amount", {
				type: "number",
				requiresArg: true,
				description: "The amount of tokens to be migrated",
			})
			.option("stakeStartTime", {
				type: "number",
				requiresArg: true,
				description: "The start time (timestamp) for the stake migration",
			})
			.check((argv) => {
				if (!argv.username && !argv.publicKey) {
					throw new Error("Either username or publicKey is required");
				}
				return true;
			})
			.demandOption(["mint", "amount", "stakeStartTime"]),
	handler: async ({ mint, publicKey, amount, stakeStartTime, username }) => {
		const { payer, provider } = await loadProvider();

		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;

		const ata = getAssociatedTokenAddressSync(
			new PublicKey(mint),
			payer.publicKey,
		);

		// check if ata exists
		const ataInfo = await provider.connection.getAccountInfo(ata);
		if (!ataInfo) {
			// create ata
			await createAssociatedTokenAccount(
				provider.connection,
				payer,
				new PublicKey(mint),
				payer.publicKey,
			);
		}

		let publicKeyBytes = null;

		if (username) {
			const eosPublicKey = await extractKeyFromEosUsername(username, "active");
			publicKeyBytes = extractEosPublicKeyBytes(eosPublicKey);
		} else if (publicKey) {
			publicKeyBytes = publicKey.startsWith("0x")
				? toBytes(publicKey)
				: extractEosPublicKeyBytes(publicKey);
		}

		if (!publicKeyBytes) {
			throw new Error("Invalid public key");
		}

		const confirm = await askForConfirmation(
			`Are you sure you want to create a migration claim for: ${publicKey} with amount: ${amount} and stake start time: ${stakeStartTime} (${new Date(stakeStartTime * 1000).toLocaleDateString()})?`,
		);

		if (!confirm) {
			console.log(chalk.red.bold("Migration claim creation cancelled"));
			return;
		}

		const { migrationAccount } = await createMigrationClaim({
			program: migrationProgram,
			publicKey: publicKeyBytes,
			mint: new anchor.web3.PublicKey(mint),
			userTokenAccount: ata,
			amount: amount * 10 ** 6,
			stakeStartTime,
		});

		console.log(
			chalk.green.bold(
				"Migration claim created at",
				migrationAccount.toString(),
			),
		);
	},
};
