import { loadProvider } from "@effectai/utils";
import type { Command } from "commander";

import {
  getAssociatedTokenAccount,
  getCreatePaymentPoolInstructionAsync,
} from "@effectai/program-sdk";
import { loadSolanaContext } from "../../helpers.js";

import {
  generateKeyPairSigner,
  address,
  createKeyPairSignerFromPrivateKeyBytes,
  pipe,
  appendTransactionMessageInstructions,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
} from "@solana/kit";

import { getCreateAssociatedTokenInstructionAsync } from "@solana-program/token";

export function registerCreatePaymentPoolCommand(program: Command) {
  program
    .command("create")
    .description("create a payment pool")
    .requiredOption(
      "--address <path>",
      "The public key of the manager base58 encoded",
    )
    .requiredOption("--mint <key>", "The mint address")
    .requiredOption(
      "--amount <number>",
      "the amount to transfer into the payment account",
    )
    .action(async (options) => {
      const { payer, provider, websocketUrl } = await loadProvider();
      const { rpc, rpcSubscriptions } = await loadSolanaContext();

      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      const mint = address(options.mint);
      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        payer.secretKey.slice(0, 32),
      );

      const ata = await getAssociatedTokenAccount({
        mint,
        owner: signer.address,
      });

      const paymentAccount = await generateKeyPairSigner();
      const account = await rpc
        .getAccountInfo(address(ata), {
          encoding: "jsonParsed",
        })
        .send();

      const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
        mint,
        payer: signer,
        owner: signer.address,
      });

      const instruction = await getCreatePaymentPoolInstructionAsync({
        authorityArg: address(options.address),
        authority: signer,
        amount: BigInt(options.amount * 1e6),
        paymentAccount,
        mint,
        userTokenAccount: ata,
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
            account.value ? [instruction] : [createAtaIx, instruction],
            tx,
          ),
      );

      const signedTx =
        await signTransactionMessageWithSigners(transactionMessage);

      await sendAndConfirmTransaction(signedTx, {
        commitment: "confirmed",
      });
    });

  return program;
}
