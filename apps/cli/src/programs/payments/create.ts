import {
  getAssociatedTokenAccount,
  loadSolanaProviderFromConfig,
} from "@effectai/solana-utils";

import type { Command } from "commander";

import { generateKeyPairSigner, address } from "@solana/kit";
import { getCreatePaymentPoolInstructionAsync } from "@effectai/payment";
import { useConnection } from "../../helpers.js";

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
      const { signer } = await loadSolanaProviderFromConfig();
      const { connection } = await useConnection();

      const mint = address(options.mint);

      const ata = await getAssociatedTokenAccount({
        mint,
        owner: signer.address,
      });

      const paymentAccount = await generateKeyPairSigner();

      const createPaymentPoolIx = await getCreatePaymentPoolInstructionAsync({
        managerAuthority: address(options.address),
        authority: signer,
        amount: BigInt(options.amount * 1e6),
        paymentAccount,
        mint,
        userTokenAccount: ata,
      });

      await connection.sendTransactionFromInstructions({
        feePayer: signer,
        instructions: [createPaymentPoolIx],
        commitment: "confirmed",
      });

      console.log("Payment Pool Created: ", paymentAccount.address);

      return;
    });

  return program;
}
