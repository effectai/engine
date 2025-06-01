import * as anchor from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";

import type { EffectMigration } from "../../target/types/effect_migration";
import { EffectMigrationIdl } from "@effectai/idl";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

interface MigrationClaimOptions {
  account: string;
  mint: string;
}

export const destroyMigrationClaimCommand: CommandModule<
  unknown,
  MigrationClaimOptions
> = {
  command: "destroy",
  describe: "Destroy a migration claim",
  builder: (yargs) =>
    yargs
      .option("mint", {
        type: "string",
        requiresArg: true,
        description: "The mint of the token",
      })
      .option("account", {
        type: "string",
        requiresArg: true,
        description: "The account to be destroyed",
      })
      .demandOption(["account"]),
  handler: async ({ mint, account }) => {
    const { provider } = await loadProvider();

    const migrationProgram = new anchor.Program(
      EffectMigrationIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectMigration>;

    const mintKey = new PublicKey(mint);

    const ata = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      new PublicKey("nXwHwpf23pp1GVE9AXV3KJTN4orAqWGFgwHQT8E7qEx"),
      true,
    );

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 200_000,
    });

    const transaction = await migrationProgram.methods
      .destroyClaim()
      .preInstructions([addPriorityFee])
      .accounts({
        migrationAccount: new PublicKey(account),
        mint: mintKey,
        userTokenAccount: ata,
      })
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

    console.log(bs58.encode(serializedTx));
  },
};
