import { Command } from "commander";
import { loadProvider } from "@effectai/utils";
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
import { getInitRewardsInstructionAsync } from "@effectai/program-sdk";

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
      const { payer, provider, websocketUrl } = await loadProvider();
      const { rpc, rpcSubscriptions } = await loadSolanaContext();

      const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
        rpc,
        rpcSubscriptions,
      });

      const signer = await createKeyPairSignerFromPrivateKeyBytes(
        payer.secretKey.slice(0, 32),
      );

      const initIx = await getInitRewardsInstructionAsync({
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
