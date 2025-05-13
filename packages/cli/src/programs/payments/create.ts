import * as anchor from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import chalk from "chalk";
import BN from "bn.js";

import { readFileSync } from "node:fs";

import { type EffectPayment, EffectPaymentIdl } from "@effectai/idl";
import { loadProvider } from "@effectai/utils";
import type { Command } from "commander";

interface PaymentsCreateOptions {
  keypair: string;
  mint: string;
  amount: number;
}

export function registerCreatePaymentPoolCommand(program: Command) {
  program
    .command("create")
    .description("create a payment pool")
    .requiredOption("--keypair <path>", "The path to the keypair file")
    .requiredOption("--mint <key>", "The mint address")
    .requiredOption(
      "--amount <number>",
      "the amount to transfer into the payment account",
    )
    .action(async (options) => {
      const { payer, provider } = await loadProvider();

      const privateKey = readFileSync(options.keypair, "utf-8");
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      const kp = Keypair.fromSeed(secretKey.slice(0, 32));

      const paymentProgram = new anchor.Program(
        EffectPaymentIdl as anchor.Idl,
        provider,
      ) as unknown as anchor.Program<EffectPayment>;

      const mint = new PublicKey(options.mint);

      const ata = getAssociatedTokenAddressSync(mint, payer.publicKey);

      const managerPubKey = kp.publicKey;
      const paymentAccount = anchor.web3.Keypair.generate();

      await paymentProgram.methods
        .createPaymentPool([managerPubKey], new BN(options.amount / 1e6))
        .accounts({
          paymentAccount: paymentAccount.publicKey,
          mint,
          userTokenAccount: ata,
        })
        .preInstructions([
          ...((await provider.connection.getAccountInfo(ata))
            ? []
            : [
                createAssociatedTokenAccountIdempotentInstructionWithDerivation(
                  payer.publicKey,
                  payer.publicKey,
                  mint,
                ),
              ]),
        ])
        .signers([paymentAccount])
        .rpc();

      console.log(
        chalk.green(
          "Payment pool created",
          paymentAccount.publicKey.toBase58(),
        ),
      );
    });

  return program;
}
