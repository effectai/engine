import * as anchor from "@coral-xyz/anchor";
import { EffectVestingIdl, type EffectVesting } from "@effectai/idl";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";
import { createVesting } from "../../utils/vesting";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";

import { askForConfirmation } from "../utils";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { BN } from "bn.js";
import chalk from "chalk";

export const vestingCreateCommand: CommandModule<
  unknown,
  {
    mint: string;
    amount: number;
    startTime: number;
    duration: number;
    recipient: string;
    authority: string;
  }
> = {
  describe: "creates a vesting account",
  command: "create",
  builder: (yargs) =>
    yargs
      .option("recipient", {
        type: "string",
        requiresArg: true,
        description: "The recipient token account",
      })
      .option("startTime", {
        type: "number",
        requiresArg: true,
        description: "The start time of the vesting (UNIX timestamp)",
      })
      .options("duration", {
        type: "number",
        requiresArg: true,
        description: "The duration of the vesting in seconds",
      })
      .option("amount", {
        type: "number",
        requiresArg: true,
        description: "The amount of tokens to vest",
      })
      .option("mint", {
        type: "string",
        requiresArg: true,
        description: "The mint address for the token to be migrated",
      })
      .demandOption(["mint"]),
  handler: async ({ mint, amount, startTime, duration, recipient }) => {
    const { payer, provider } = await loadProvider();

    const vestingProgram = new anchor.Program(
      EffectVestingIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectVesting>;

    const vestingUntil = startTime + duration; // in seconds
    const startTimeReadable = new Date(startTime * 1000).toUTCString();
    const durationReadable = new Date(vestingUntil * 1000).toUTCString();

    const confirmed = await askForConfirmation(
      `Create vesting for (${recipient}) on ${
        provider.connection.rpcEndpoint
      } with the following: \n            
- amount: ${amount}
- starts on: ${startTimeReadable}
- until:  ${durationReadable}
- tokens released per second: ${amount / duration}
- tokens released per hour: ${amount / (duration / 3600)}
- tokens released per day: ${amount / (duration / 86400)}

Please confirm`,
    );

    if (!confirmed) {
      console.log("Aborting");
      return;
    }

    const { vestingAccount, vestingVaultAccount } = await createVesting({
      startTime,
      isClosable: true,
      mint: new anchor.web3.PublicKey(mint),
      payer,
      tag: "v",
      amount,
      recipientTokenAccount: new PublicKey(recipient),
      releaseRate: (amount * 1e6) / duration,
      program: vestingProgram,
    });

    console.log("Vesting account created", vestingAccount.publicKey.toBase58());

    const topupConfirm = await askForConfirmation(
      `topup vesting account with ${amount} tokens ?`,
    );

    if (!topupConfirm) {
      console.log("Aborting");
      return;
    }

    // transfer the tokens to the vesting account
    const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 100_000,
    });

    const ata = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      payer.publicKey,
    );

    const topupTransaction = new Transaction().add(
      priorityFee,
      createTransferCheckedInstruction(
        // source,
        ata,
        // mint
        new PublicKey(mint),
        // destination
        vestingVaultAccount,
        // owner
        payer.publicKey,
        // amount
        new BN(amount * 1e6).toNumber(),
        // mint decimals
        6,
      ),
    );

    topupTransaction.recentBlockhash = (
      await provider.connection.getLatestBlockhash()
    ).blockhash;
    topupTransaction.feePayer = payer.publicKey;
    const topupTx = await provider.sendAndConfirm(topupTransaction, [payer]);

    console.log(chalk.green(`Topup successful, tx: ${topupTx}`));
  },
};
