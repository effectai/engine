import * as anchor from "@coral-xyz/anchor";
import { createMigrationClaim } from "../../utils/migration";
import EffectMigrationIdl from '../../target/idl/effect_migration.json'
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
	command: "migration create",
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
	handler: async ({
		mint,
		publicKey,
		amount,
		type,
		stakeStartTime,
		username,
	}) => {
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
			await createAssociatedTokenAccount(provider.connection, payer, new PublicKey(mint), payer.publicKey);
		}

		let publicKeyBytes = null;

		if (username) {
			const eosPublicKey = await extractKeyFromEosUsername(username);
			publicKeyBytes = extractEosPublicKeyBytes(eosPublicKey);
		} else if (publicKey) {
			publicKeyBytes = toBytes(publicKey);
		}

		if (!publicKeyBytes) {
			throw new Error("Invalid public key");
		}

		const { migrationAccount } = await createMigrationClaim({
			program: migrationProgram,
			publicKey: publicKeyBytes,
			mint: new anchor.web3.PublicKey(mint),
			userTokenAccount: ata,
			amount: amount * 10 ** 6,
			stakeStartTime
		});

		console.log(
			chalk.green.bold("Migration claim created at", migrationAccount.toString()),
		);
	},
};
