import { toBytes } from "viem";
import { Command } from "commander";
import chalk from "chalk";
import {
  extractEosPublicKeyBytes,
  extractKeyFromEosUsername,
  askForConfirmation,
} from "@effectai/utils";
import { PublicKey } from "@solana/web3.js";
import { address } from "@solana/kit";
import { useConnection } from "../../helpers.js";
import { getCreateAssociatedTokenInstructionAsync } from "@solana-program/token";
import {
  getAssociatedTokenAccount,
  loadSolanaProviderFromConfig,
  useDeriveMigrationAccounts,
} from "@effectai/solana-utils";
import {
  EFFECT_MIGRATION_PROGRAM_ADDRESS,
  getCreateStakeClaimInstructionAsync,
} from "@effectai/migration";

interface MigrationClaimOptions {
  mint: string;
  publicKey?: string;
  amount: number;
  stakeStartTime: number;
  username?: string;
}

export const registerCreateMigrationClaim = (program: Command) => {
  program
    .command("create")
    .description("Create a new migration claim")
    .requiredOption(
      "--mint <mint>",
      "The mint address of the token to be migrated",
    )
    .option(
      "--username <username>",
      "The username of the account to be migrated",
    )
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
    )
    .action(async (options: MigrationClaimOptions) => {
      const { publicKey, amount, stakeStartTime, username } = options;

      if (!username && !publicKey) {
        console.error(
          chalk.red("Error: Either username or publicKey is required"),
        );
        process.exit(1);
      }

      const { signer, provider } = await loadSolanaProviderFromConfig();
      const { connection } = await useConnection();

      const mint = address(options.mint);

      const ata = await connection.getTokenAccountAddress(signer.address, mint);

      // check if ata exists
      const ataExists = await connection.checkTokenAccountIsClosed({
        tokenAccount: ata,
      });

      let publicKeyBytes = null;

      if (username) {
        const eosPublicKey = await extractKeyFromEosUsername(
          username,
          "active",
        );
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
        `Are you sure you want to create a migration claim for: ${publicKey} with amount: ${amount} and stake start time: ${stakeStartTime} (${new Date(
          stakeStartTime * 1000,
        ).toLocaleDateString()})?`,
      );

      if (!confirm) {
        console.log(chalk.red.bold("Migration claim creation cancelled"));
        return;
      }

      const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
        mint,
        payer: signer,
        owner: signer.address,
      });

      const { vaultAccount, migrationAccount } = useDeriveMigrationAccounts({
        mint: new PublicKey(mint),
        foreignAddress: publicKeyBytes,
        programId: new PublicKey(EFFECT_MIGRATION_PROGRAM_ADDRESS),
      });

      const instruction = await getCreateStakeClaimInstructionAsync({
        migrationAccount: address(migrationAccount.toBase58()),
        userTokenAccount: ata,
        stakeStartTime,
        foreignAddress: publicKeyBytes,
        mint: address(mint),
        amount: amount * 10 ** 6,
        authority: signer,
      });

      const tx = await connection.sendTransactionFromInstructions({
        feePayer: signer,
        instructions: ataExists ? [createAtaIx, instruction] : [instruction],
      });

      console.log("Transaction sent:", tx);
      console.log(chalk.green.bold("Migration claim created!"));
    });
};
