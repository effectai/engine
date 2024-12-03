import * as anchor from "@coral-xyz/anchor";
import { type EffectMigration, EffectMigrationIdl } from "@effectai/shared";
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

interface MigrationClaimOptions {
	mint: string;
	publicKey: string;
	amount: number;
	type: "token" | "stake";
	stakeStartTime?: number;
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
			.option("type", {
				type: "string",
				possible: ["token", "stake"] as const,
				default: "token",
				description: "The type of migration claim to create",
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
			.demandOption(["mint", "amount"]),
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

		if (type !== "token" && type !== "stake") {
			throw new Error("Invalid migration type");
		}

		const ata = getAssociatedTokenAddressSync(
			new PublicKey(mint),
			payer.publicKey,
		);

		let publicKeyBytes = null;

		if (username) {
			const publicKey = await extractKeyFromEosUsername(username);
			publicKeyBytes = extractEosPublicKeyBytes(publicKey);
		} else if (publicKey) {
			publicKeyBytes = toBytes(publicKey);
		}

		if (!publicKeyBytes) {
			throw new Error("Invalid public key");
		}

		const { claimAccount } = await createMigrationClaim({
			program: migrationProgram,
			type,
			publicKey: publicKeyBytes,
			mint: new anchor.web3.PublicKey(mint),
			payer,
			amount: amount * 10 ** 6,
			payerTokens: ata,
			stakeStartTime: type === "stake" ? stakeStartTime : undefined,
		});

		console.log(
			chalk.green.bold("Migration claim created at", claimAccount.toString()),
		);
	},
};
