import { toBytes } from "viem";
import { Command } from "commander";
import chalk from "chalk";
import {
  extractEosPublicKeyBytes,
  extractKeyFromEosUsername,
  askForConfirmation,
} from "@effectai/utils";
import { PublicKey } from "@solana/web3.js";
import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromPrivateKeyBytes,
  createTransactionMessage,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { loadSolanaContext } from "../../helpers.js";
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
      const { rpc, rpcSubscriptions } = await loadSolanaContext();

      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      const mint = address(options.mint);

      const ata = await getAssociatedTokenAccount({
        mint,
        owner: signer.address,
      });

      // check if ata exists
      const ataInfo = await rpc
        .getAccountInfo(address(ata), {
          encoding: "jsonParsed",
        })
        .send();

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

      console.log("migrationaccount", migrationAccount.toBase58());
      const instruction = await getCreateStakeClaimInstructionAsync({
        migrationAccount: address(migrationAccount.toBase58()),
        userTokenAccount: ata,
        stakeStartTime,
        foreignAddress: publicKeyBytes,
        mint: address(mint),
        amount: amount * 10 ** 6,
        authority: signer,
      });

      const recentBlockhash = await rpc.getLatestBlockhash().send();
      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            recentBlockhash.value,
            tx,
          ),
        (tx) =>
          appendTransactionMessageInstructions(
            ataInfo.value ? [instruction] : [createAtaIx, instruction],
            tx,
          ),
      );

      const signedTx =
        await signTransactionMessageWithSigners(transactionMessage);

      await sendAndConfirmTransaction(signedTx, {
        commitment: "confirmed",
      });

      //
      // const { migrationAccount } = await createMigrationClaim({
      //   program: EFFECT_VESTING_PROGRAM_ADDRESS,
      //   publicKey: publicKeyBytes,
      //   mint: new anchor.web3.PublicKey(mint),
      //   userTokenAccount: ata,
      //   amount: amount * 10 ** 6,
      //   stakeStartTime,
      // });

      console.log(chalk.green.bold("Migration claim created!"));
    });
};
