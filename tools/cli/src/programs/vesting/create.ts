import { Command } from "commander";
import { askForConfirmation } from "@effectai/utils";
import {
  getOpenInstructionAsync,
  EFFECT_VESTING_PROGRAM_ADDRESS,
} from "@effectai/vesting";
import {
  address,
  createKeyPairSignerFromPrivateKeyBytes,
  generateKeyPairSigner,
  createTransactionMessage,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  setTransactionMessageFeePayerSigner,
  createSolanaRpcSubscriptions,
  sendAndConfirmTransactionFactory,
  signTransactionMessageWithSigners,
  getProgramDerivedAddress,
  getAddressEncoder,
  appendTransactionMessageInstructions,
} from "@solana/kit";
import { createSolanaRpc } from "@solana/kit";

import { getTransferCheckedInstruction } from "@solana-program/token";
import { pipe } from "@solana/functional";
import { loadSolanaContext } from "../../helpers";
import { getAssociatedTokenAccount } from "@effectai/solana-utils";

export const vestingCreateCommand = new Command("create")
  .description("creates a vesting account")
  .requiredOption(
    "--mint <address>",
    "The mint address for the token to be migrated",
  )
  .requiredOption("--recipient <address>", "The recipient token account")
  .requiredOption(
    "--startTime <timestamp>",
    "The start time of the vesting (UNIX timestamp)",
    parseFloat,
  )
  .requiredOption(
    "--duration <seconds>",
    "The duration of the vesting in seconds",
    parseFloat,
  )
  .requiredOption(
    "--amount <number>",
    "The amount of tokens to vest",
    parseFloat,
  )
  .action(async (options) => {
    const { mint, amount, startTime, duration, recipient } = options;
    const { signer, rpcSubscriptions, rpc } = await loadSolanaContext();

    const vestingUntil = startTime + duration; // in seconds
    const startTimeReadable = new Date(startTime * 1000).toUTCString();
    const durationReadable = new Date(vestingUntil * 1000).toUTCString();
    const vestingAccount = await generateKeyPairSigner();

    const confirmed = await askForConfirmation(
      `Create vesting for (${recipient}) with the following: \n            
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

    const instruction = await getOpenInstructionAsync({
      startTime,
      isClosable: true,
      tag: Buffer.from("v"),
      releaseRate: BigInt(Math.floor((amount * 1e6) / duration)),
      mint,
      recipientTokenAccount: address(recipient),
      authority: signer,
      vestingAccount: vestingAccount,
    });

    const [destination, _bump] = await getProgramDerivedAddress({
      programAddress: EFFECT_VESTING_PROGRAM_ADDRESS,
      seeds: [getAddressEncoder().encode(vestingAccount.address)],
    });

    const ata = await getAssociatedTokenAccount({
      mint,
      owner: signer.address,
    });

    const decimals = 6;
    const ix = getTransferCheckedInstruction({
      source: ata,
      amount: BigInt(amount * 10 ** decimals),
      authority: signer,
      destination,
      decimals: decimals,
      mint,
    });

    const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    const recentBlockhash = await rpc.getLatestBlockhash().send();
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer, tx),
      (tx) =>
        setTransactionMessageLifetimeUsingBlockhash(recentBlockhash.value, tx),
      (tx) => appendTransactionMessageInstructions([instruction, ix], tx),
    );

    const signedTx =
      await signTransactionMessageWithSigners(transactionMessage);

    await sendAndConfirmTransaction(signedTx, {
      commitment: "confirmed",
    });

    console.log(
      "Vesting account created successfully!",
      vestingAccount.address,
    );
  });
