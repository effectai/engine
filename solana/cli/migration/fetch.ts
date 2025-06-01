import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import type { EffectMigration } from "../../target/types/effect_migration";

import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  extractEosPublicKeyBytes,
  useDeriveMigrationAccounts,
} from "@effectai/utils";
import { EffectMigrationIdl } from "@effectai/idl";
import { toBytes } from "viem";

export const fetchMigrationAccount: CommandModule<unknown, { mint: string }> = {
  describe: "Distributes the migration accounts based on a csv file",
  command: "fetch",
  handler: async () => {
    const { payer, provider } = await loadProvider();
    const migrationProgram = new anchor.Program(
      EffectMigrationIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectMigration>;

    const publicKey = toBytes("0x6194Cc27681f0Fc188E3C81E2b0220Ba0A645046");

    if (!publicKey) {
      console.error("Invalid public key");
      return;
    }

    const { migrationAccount } = useDeriveMigrationAccounts({
      foreignAddress: publicKey,
      mint: new PublicKey("EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E"),
      programId: migrationProgram.programId,
    });

    console.log(migrationAccount.toBase58());

    //   convert bytes to eos public KEy
  },
};
