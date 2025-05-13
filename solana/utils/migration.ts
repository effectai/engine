import {
  Keypair,
  type PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import {
  useDeriveMigrationAccounts,
  useDeriveStakeAccounts,
} from "@effectai/utils";
import type { EffectMigration } from "../target/types/effect_migration";
import type { EffectStaking } from "../target/types/effect_staking";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const SECONDS_PER_DAY = 24 * 60 * 60;

export const claimMigration = async ({
  migrationProgram,
  stakeProgram,
  ata,
  mint,
  payer,
  signature,
  foreignAddress,
  message,
}: {
  migrationProgram: anchor.Program<EffectMigration>;
  stakeProgram: anchor.Program<EffectStaking>;
  ata: PublicKey;
  mint: PublicKey;
  payer: Keypair;
  signature: Uint8Array;
  foreignAddress: Uint8Array;
  message: Uint8Array;
}) => {
  const stakeAccount = new anchor.web3.Keypair();

  const { vaultAccount: stakeVaultAccount } = useDeriveStakeAccounts({
    stakingAccount: stakeAccount.publicKey,
    programId: stakeProgram.programId,
  });

  // derive the migration account from the mint + foreignAddress
  const { migrationAccount, vaultAccount } = useDeriveMigrationAccounts({
    mint,
    foreignAddress,
    programId: migrationProgram.programId,
  });

  await migrationProgram.methods
    .claimStake(Buffer.from(signature), Buffer.from(message))
    .preInstructions([
      ...[
        await stakeProgram.methods
          .stake(new BN(0), new BN(30 * SECONDS_PER_DAY))
          .accounts({
            stakeAccount: stakeAccount.publicKey,
            authority: payer.publicKey,
            userTokenAccount: ata,
            mint,
          })
          .signers([stakeAccount])
          .instruction(),
      ],
    ])
    .accounts({
      recipientTokenAccount: ata,
      stakeAccount: stakeAccount.publicKey,
      migrationAccount,
      mint,
    })
    .signers([stakeAccount])
    .rpc();

  return { stakeAccount, stakeVaultAccount, migrationAccount };
};

export const createMigrationClaim = async ({
  publicKey,
  mint,
  userTokenAccount,
  amount,
  program,
  stakeStartTime,
}: {
  publicKey: Uint8Array;
  mint: PublicKey;
  userTokenAccount: PublicKey;
  program: anchor.Program<EffectMigration>;
  amount: number;
  stakeStartTime: number;
}) => {
  if (!stakeStartTime) {
    throw new Error("stakeStartTime is required for stake");
  }

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 100_000,
  });

  await program.methods
    .createStakeClaim(
      Buffer.from(publicKey),
      new BN(stakeStartTime),
      new BN(amount)
    )
    .preInstructions([addPriorityFee])
    .accounts({
      userTokenAccount,
      mint,
    })
    .rpc();

  const { vaultAccount, migrationAccount } = useDeriveMigrationAccounts({
    mint,
    foreignAddress: publicKey,
    programId: program.programId,
  });

  return { migrationAccount, vaultAccount };
};
