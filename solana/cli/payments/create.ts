import * as anchor from "@coral-xyz/anchor";
import { createMigrationClaim } from "../../utils/migration";
import { toBytes } from "viem";
import {
  createAssociatedTokenAccount,
  createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { loadProvider } from "../../utils/provider";
import chalk from "chalk";

import type { CommandModule } from "yargs";
import {
  extractEosPublicKeyBytes,
  extractKeyFromEosUsername,
} from "@effectai/utils";
import type { EffectMigration } from "../../target/types/effect_migration";
import {
  EffectMigrationIdl,
  EffectPayment,
  EffectPaymentIdl,
} from "@effectai/shared";
import { askForConfirmation } from "../utils";

interface MigrationClaimOptions {
  mint: string;
  publicKey: string;
  amount: number;
  stakeStartTime: number;
  username?: string;
}

export const createPaymentPool: CommandModule<unknown, MigrationClaimOptions> =
  {
    command: "create",
    describe: "create a payment pool",
    handler: async () => {
      const { payer, provider } = await loadProvider();

      const paymentProgram = new anchor.Program(
        EffectPaymentIdl as anchor.Idl,
        provider,
      ) as unknown as anchor.Program<EffectPayment>;

      const mint = new PublicKey("mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P");

      const ata = getAssociatedTokenAddressSync(mint, payer.publicKey);

      const managerPubKey = new PublicKey(
        // "2Y6qpvAMTD63R3i5d99ujekBFkWUjereXrPmEuu5b8mw",
        "Zh3DBwEMAxU2uN8rq5Jmo54m2PoUPt6V89UGaiz6EYx",
      );

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
