import { Command } from "commander";
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
import { getInitInstructionAsync } from "@effectai/reward";

interface RewardInitOptions {
  mint: string;
}

export const registerInitRewardCommand = (program: Command) =>
  program
    .command("init")
    .description("init reward accounts")
    .requiredOption(
      "--mint <mint>",
      "The mint address of the token that belongs to the reward program",
    )
    .action(async (options: RewardInitOptions) => {
      const mint = address(options.mint);
      const { rpc, rpcSubscriptions, signer } = await loadSolanaContext();

      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      const initIx = await getInitInstructionAsync({
        authority: signer,
        mint,
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
        (tx) => appendTransactionMessageInstructions([initIx], tx),
      );

      const signedTx =
        await signTransactionMessageWithSigners(transactionMessage);

      await sendAndConfirmTransaction(signedTx, {
        commitment: "confirmed",
      });
    });
