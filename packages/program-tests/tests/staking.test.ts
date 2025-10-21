import { describe, beforeAll, test } from "vitest";
import { generateKeyPairSigner, type KeyPairSigner } from "@solana/kit";
import type { Connection } from "solana-kite";
import { setup } from "@effectai/test-utils";
import {
  getMigrateInstructionAsync,
  getStakeInstructionAsync,
} from "@effectai/staking";

describe("Staking tests", () => {
  let connection: Connection;
  let wallet: KeyPairSigner;

  beforeAll(() => {
    if (!globalThis.__connection__ || !globalThis.__wallet__) {
      throw new Error("Connection or wallet not initialized");
    }
    connection = globalThis.__connection__;
    wallet = globalThis.__wallet__;
  });

  test.concurrent("cannot migrate a stake account", async () => {
    const { mint, ata } = await setup(connection, wallet);

    const applicationAccount = await generateKeyPairSigner();

    //create stake account
    const stakeAccount = await generateKeyPairSigner();

    const stakeIx = await getStakeInstructionAsync({
      authority: wallet,
      duration: 30 * 24 * 60 * 60, // 30 days
      mint,
      amount: 0n,
      userTokenAccount: ata,
      stakeAccount: stakeAccount,
      scope: applicationAccount.address,
    });

    const migrateIx = await getMigrateInstructionAsync({
      authority: wallet,
      stakeAccount: stakeAccount.address,
      mint,
    });

    const tx = await connection.sendTransactionFromInstructions({
      instructions: [stakeIx, migrateIx],
      feePayer: wallet,
    });
  });

  test.concurrent("It cannot STAKE less then MIN_STAKE_DURATION", () => {}, {
    todo: true,
  });

  test.concurrent("It (partially) slashes a stake account", () => {}, {
    todo: true,
  });

  test.concurrent(
    "Cannot enter the reward pool with a unstakable stake account",
    () => {},
    { todo: true },
  );

  test.concurrent("Not allowed to unstake", async () => {}, { todo: true });
});
