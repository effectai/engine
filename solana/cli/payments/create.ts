import * as anchor from "@coral-xyz/anchor";
import { toBytes } from "viem";
import {
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { loadProvider } from "../../utils/provider";
import chalk from "chalk";

import { readFileSync } from "fs";

import type { CommandModule } from "yargs";
import { EffectPayment, EffectPaymentIdl } from "@effectai/shared";

interface PaymentsCreateOptions {
  keypair: string;
}

export const createPaymentPool: CommandModule<unknown, PaymentsCreateOptions> =
  {
    command: "create",
    describe: "create a payment pool",
    builder: (yargs) => {
      yargs.option("keypair", {
        type: "string",
        demandOption: true,
        description: "The path to the keypair file",
      });
    },
    handler: async ({ keypair }) => {
      const { payer, provider } = await loadProvider();

      const privateKey = readFileSync(keypair, "utf-8");
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      const kp = Keypair.fromSeed(secretKey.slice(0, 32));

      const paymentProgram = new anchor.Program(
        EffectPaymentIdl as anchor.Idl,
        provider,
      ) as unknown as anchor.Program<EffectPayment>;

      const mint = new PublicKey("mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P");

      const ata = getAssociatedTokenAddressSync(mint, payer.publicKey);

      const managerPubKey = kp.publicKey;
      const paymentAccount = anchor.web3.Keypair.generate();

      await paymentProgram.methods
        .createPaymentPool([managerPubKey], new anchor.BN(1_000_000_000))
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
    },
  };
