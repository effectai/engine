import * as anchor from "@coral-xyz/anchor";
import { toBytes } from "viem";
import {
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import chalk from "chalk";
import { Command } from "commander";
import {
  extractEosPublicKeyBytes,
  extractKeyFromEosUsername,
  loadProvider,
  askForConfirmation,
} from "@effectai/utils";
import { EffectMigration, EffectMigrationIdl } from "@effectai/idl";
import { getCreateStakeClaimInstructionAsync } from "@effectai/program-sdk";
import { PublicKey } from "@solana/web3.js";
import { address } from "@solana/kit";

interface MigrationClaimOptions {
  mint: string;
  publicKey?: string;
  amount: number;
  stakeStartTime: number;
  username?: string;
}

export const createMigrationClaimCommand = new Command()
  .name("create")
  .description("Create a new migration claim")
  .requiredOption(
    "--mint <mint>",
    "The mint address of the token to be migrated",
  )
  .option("--username <username>", "The username of the account to be migrated")
  .option(
    "--publicKey <publicKey>",
    "The public key of the account to be migrated",
  )
  .requiredOption(
    "--amount <amount>",
    "The amount of tokens to be migrated",
    parseFloat,
  )
  .requiredOption(
    "--stakeStartTime <stakeStartTime>",
    "The start time (timestamp) for the stake migration",
    parseInt,
  );
// .action(async (options: MigrationClaimOptions) => {
//   const { mint, publicKey, amount, stakeStartTime, username } = options;
//
//   if (!username && !publicKey) {
//     console.error(
//       chalk.red("Error: Either username or publicKey is required"),
//     );
//     process.exit(1);
//   }
//
//   const { payer, provider } = await loadProvider();
//
//   const migrationProgram = new anchor.Program(
//     EffectMigrationIdl as anchor.Idl,
//     provider,
//   ) as unknown as anchor.Program<EffectMigration>;
//
//   const ata = getAssociatedTokenAddressSync(
//     new PublicKey(mint),
//     payer.publicKey,
//   );
//
//   // check if ata exists
//   const ataInfo = await provider.connection.getAccountInfo(ata);
//   if (!ataInfo) {
//     // create ata
//     await createAssociatedTokenAccount(
//       provider.connection,
//       payer,
//       new PublicKey(mint),
//       payer.publicKey,
//     );
//   }
//
//   let publicKeyBytes = null;
//
//   if (username) {
//     const eosPublicKey = await extractKeyFromEosUsername(username, "active");
//     publicKeyBytes = extractEosPublicKeyBytes(eosPublicKey);
//   } else if (publicKey) {
//     publicKeyBytes = publicKey.startsWith("0x")
//       ? toBytes(publicKey)
//       : extractEosPublicKeyBytes(publicKey);
//   }
//
//   if (!publicKeyBytes) {
//     throw new Error("Invalid public key");
//   }
//
//   const confirm = await askForConfirmation(
//     `Are you sure you want to create a migration claim for: ${publicKey} with amount: ${amount} and stake start time: ${stakeStartTime} (${new Date(
//       stakeStartTime * 1000,
//     ).toLocaleDateString()})?`,
//   );
//
//   if (!confirm) {
//     console.log(chalk.red.bold("Migration claim creation cancelled"));
//     return;
//   }
//
//   const result = await getCreateStakeClaimInstructionAsync({
//     userTokenAccount: ata,
//     stakeStartTime,
//     foreignAddress: publicKeyBytes,
//     mint: address(mint),
//     amount: amount * 10 ** 6,
//   });
//
//   const { migrationAccount } = await createMigrationClaim({
//     program: migrationProgram,
//     publicKey: publicKeyBytes,
//     mint: new anchor.web3.PublicKey(mint),
//     userTokenAccount: ata,
//     amount: amount * 10 ** 6,
//     stakeStartTime,
//   });
//
//   console.log(
//     chalk.green.bold(
//       "Migration claim created at",
//       migrationAccount.toString(),
//     ),
//   );
// });
