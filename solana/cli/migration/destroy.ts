import * as anchor from "@coral-xyz/anchor";
import { createMigrationClaim } from "../../utils/migration";
import { toBytes } from "viem";
import {
	createAssociatedTokenAccount,
	getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { loadProvider } from "../../utils/provider";
import chalk from "chalk";

import type { CommandModule } from "yargs";

import type { EffectMigration } from "../../target/types/effect_migration";
import { EffectMigrationIdl } from "@effectai/shared";

interface MigrationClaimOptions {
	account: string;
    mint: string;
}

export const destroyMigrationClaimCommand: CommandModule<
	unknown,
	MigrationClaimOptions
> = {
	command: "destroy",
	describe: "Destroy a migration claim",
	builder: (yargs) =>
		yargs
			.option("mint", {
				type: "string",
				requiresArg: true,
				description: "The mint of the token",
			})
			.option("account", {
				type: "string",
				requiresArg: true,
				description: "The account to be destroyed",
			})
			.demandOption(["account"]),
	handler: async ({ mint, account }) => {
		const { payer, provider } = await loadProvider();

		const migrationProgram = new anchor.Program(
			EffectMigrationIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectMigration>;

        const mintKey = new PublicKey(mint);

		const ata = getAssociatedTokenAddressSync(
			new PublicKey(mint),
			payer.publicKey,
		);

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 100_000,
        });

        await migrationProgram.methods.destroyClaim()
        .preInstructions([
            addPriorityFee,
        ])
        .accounts({
            migrationAccount: new PublicKey(account),
            mint: mintKey,
            userTokenAccount: ata,
        }).rpc()

		console.log(
			chalk.green.bold(
				"migration claim destroyed for account: ",
				account.toString(),
			),
		);
	},
};
