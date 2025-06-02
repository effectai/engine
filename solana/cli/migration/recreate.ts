import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";

import type { EffectMigration } from "../../target/types/effect_migration";
import { EffectMigrationIdl } from "@effectai/idl";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import {
  extractEosPublicKeyBytes,
  useDeriveMigrationAccounts,
} from "@effectai/utils";
import { toBytes } from "viem";
import { BN } from "bn.js";

interface MigrationClaimOptions {
  mint: string;
  oldPublicKey: string;
  newPublicKey: string;
  stakeStartTime: number;
  amount: number;
}

export const recreateMigrationClaimCommand: CommandModule<
  unknown,
  MigrationClaimOptions
> = {
  command: "recreate",
  describe: "recreate a migration claim",
  builder: (yargs) =>
    yargs
      .option("mint", {
        type: "string",
        requiresArg: true,
        description: "The mint of the token",
      })
      .option("oldPublicKey", {
        type: "string",
        requiresArg: true,
        description: "The old public key",
      })
      .option("newPublicKey", {
        type: "string",
        requiresArg: true,
        description: "The new public key",
      })
      .option("amount", {
        type: "number",
        requiresArg: true,
        description: "The amount to unstake",
      })
      .option("stakeStartTime", {
        type: "number",
        requiresArg: true,
        description: "The stake start time",
      })
      .demandOption([
        "mint",
        "oldPublicKey",
        "newPublicKey",
        "amount",
        "stakeStartTime",
      ]),
  handler: async ({
    mint,
    newPublicKey,
    oldPublicKey,
    amount,
    stakeStartTime,
  }) => {
    const { provider } = await loadProvider();

    const migrationProgram = new anchor.Program(
      EffectMigrationIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectMigration>;

    const mintKey = new PublicKey(mint);

    const squadsAta = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      new PublicKey("nXwHwpf23pp1GVE9AXV3KJTN4orAqWGFgwHQT8E7qEx"),
      true,
    );

    const oldPublicKeyBytes = oldPublicKey.startsWith("0x")
      ? toBytes(oldPublicKey)
      : extractEosPublicKeyBytes(oldPublicKey);

    const newPublicKeyBytes = newPublicKey.startsWith("0x")
      ? toBytes(newPublicKey)
      : extractEosPublicKeyBytes(newPublicKey);

    if (!oldPublicKeyBytes || !newPublicKeyBytes) {
      console.error("Invalid public key");
      return;
    }

    const { migrationAccount } = useDeriveMigrationAccounts({
      mint: mintKey,
      foreignAddress: oldPublicKeyBytes,
      programId: migrationProgram.programId,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    });

    const transaction = await migrationProgram.methods
      .destroyClaim()
      .preInstructions([addPriorityFee])
      .accounts({
        migrationAccount,
        mint: mintKey,
        userTokenAccount: squadsAta,
      })
      .postInstructions([
        await migrationProgram.methods
          .createStakeClaim(
            Buffer.from(newPublicKeyBytes),
            new BN(stakeStartTime),
            new BN(amount * 10 ** 6),
          )
          .accounts({
            mint: mintKey,
            userTokenAccount: squadsAta,
          })
          .instruction(),
      ])
      .transaction();

    // add recent blockhash
    transaction.recentBlockhash = (
      await provider.connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = provider.wallet.publicKey;

    // sign transaction
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
    });

    // print the transaction to console so it can be imported in squads
    console.log(bs58.encode(serializedTx));
  },
};
