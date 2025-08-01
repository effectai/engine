import { getAssociatedTokenAccount } from "@effectai/program-sdk";
import { loadProvider } from "@effectai/utils";
import { type Address, address, createSolanaRpc } from "@solana/kit";
import type { Command } from "commander";
import { loadSolanaContext } from "../../helpers.js";

export const registerCheckPayoutCommand = async (program: Command) =>
  program
    .command("check")
    .description("check payments for a worker")
    .requiredOption("--mint <key>", "The mint address")
    .requiredOption("--recipient <string>", "the worker recipient address")
    .action(async (options) => {
      console.log("Checking payments for worker...");
      const { payer, provider, websocketUrl } = await loadProvider();
      const { rpc, rpcSubscriptions } = await loadSolanaContext();

      //fetch how much EFFECT has been paid to the worker from the payment account
      const workerAta = await getAssociatedTokenAccount({
        owner: address(options.recipient),
        mint: address(options.mint),
      });

      //get all transactions for the worker's payment account
      const transactions = await rpc
        .getSignaturesForAddress(address(workerAta))
        .send();

      const transactionDetails = await Promise.all(
        transactions.map((tx) =>
          rpc
            .getTransaction(tx.signature, {
              encoding: "jsonParsed",
              maxSupportedTransactionVersion: 0,
            })
            .send(),
        ),
      );
      const totalEffectReceived = transactionDetails.reduce((total, tx) => {
        if (tx?.meta?.preTokenBalances && tx?.meta?.postTokenBalances) {
          // Find EFFECT token balance before the transaction
          const preBalance = tx.meta.preTokenBalances.find(
            (balance) =>
              balance.mint === "EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E",
          );

          // Find EFFECT token balance after the transaction
          const postBalance = tx.meta.postTokenBalances.find(
            (balance) =>
              balance.mint === "EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E",
          );

          if (!preBalance && postBalance) {
            return total + BigInt(postBalance.uiTokenAmount.amount);
          }

          if (preBalance && postBalance) {
            const preAmount = BigInt(preBalance.uiTokenAmount.amount);
            const postAmount = BigInt(postBalance.uiTokenAmount.amount);
            if (postAmount > preAmount) {
              return total + (postAmount - preAmount);
            }
          }
        }
        return total;
      }, BigInt(0));

      console.log(
        `Total EFFECT received by worker ${options.recipient}: ${totalEffectReceived / BigInt(1e6)} EFFECT`,
      );
    });
