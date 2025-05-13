import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";

import { keccak256, toBytes } from "viem";
import { secp256k1 } from "@noble/curves/secp256k1";
import { privateKeyToAccount } from "viem/accounts";

import { extractEosPublicKeyBytes } from "@effectai/utils";

import { PrivateKey } from "@wharfkit/antelope";

import type { EffectMigration } from "../../target/types/effect_migration.js";
import type { EffectStaking } from "../../target/types/effect_staking.js";

import { expect, describe, it } from "vitest";
import { useAnchor } from "../helpers.js";
import { setup } from "../../utils/spl.js";
import { claimMigration, createMigrationClaim } from "../../utils/migration.js";
import { useErrorsIDL } from "../../utils/idl.js";

import { effect_migration } from "@effectai/idl";

import { createDummyEosTransactionWithMemo } from "../../utils/eos.js";

describe("Migration Program", async () => {
  const program = anchor.workspace.EffectMigration as Program<EffectMigration>;

  const stakeProgram = anchor.workspace.EffectStaking as Program<EffectStaking>;

  const { provider, payer, expectAnchorError } = useAnchor();

  // local test data
  const originalMessage = `Effect.AI: I authorize my tokens to be claimed at the following Solana address:${payer.publicKey.toBase58()}`;
  const ethPublicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";
  const eosPublicKey =
    "PUB_K1_7abGp9AVsTpt4TLSdCFKS2Tm49zCwg8nWLpJhAmEpppG9fjJsy";

  const lastYear = Math.floor(new Date().getTime() / 1000 - 365 * 24 * 60 * 60);

  describe("Initialization", () => {
    it.concurrent("correctly initializes an ethereum based vault", async () => {
      const { mint, ata } = await setup({ provider, payer });

      const { migrationAccount } = await createMigrationClaim({
        stakeStartTime: lastYear,
        mint,
        userTokenAccount: ata,
        publicKey: toBytes(ethPublicKey),
        amount: 100_000_000,
        program,
      });

      // check if the metadata account was created
      const claimAccountData =
        await program.account.migrationAccount.fetch(migrationAccount);

      expect(claimAccountData).to.not.be.null;
      expect(claimAccountData.foreignAddress.byteLength).to.equal(20);
      expect(claimAccountData.foreignAddress).toEqual(
        Buffer.from(ethPublicKey.slice(2), "hex"),
      );
    });

    it.concurrent("correctly initializes a EOS based vault", async () => {
      const { mint, ata } = await setup({ provider, payer });

      const publicKey = extractEosPublicKeyBytes(eosPublicKey);

      if (!publicKey) {
        throw new Error("Invalid public key");
      }

      const { migrationAccount } = await createMigrationClaim({
        mint,
        userTokenAccount: ata,
        publicKey,
        amount: 100_000_000,
        program,
        stakeStartTime: lastYear,
      });

      const migrationAccountData =
        await provider.connection.getAccountInfo(migrationAccount);
      expect(migrationAccountData).to.not.be.null;
    });

    it.concurrent(
      "throws an error if the foreign public key is invalid",
      async () => {
        const { mint, ata } = await setup({ provider, payer });
        const { INVALID_FOREIGN_ADDRESS } = useErrorsIDL(effect_migration);

        expectAnchorError(async () => {
          await createMigrationClaim({
            mint,
            userTokenAccount: ata,
            publicKey: toBytes("0x123"),
            amount: 100_000_000,
            stakeStartTime: lastYear,
            program,
          });
        }, INVALID_FOREIGN_ADDRESS);
      },
    );
  });

  describe("Migration Contract: Signing & Claiming", () => {
    it.concurrent("correctly claims with an eos signature", async () => {
      const { mint, ata } = await setup({ provider, payer });

      const eosPrivatekey = PrivateKey.from(
        "5K5UuCj9PmMSFTyiWzTtPF4VmUftVqScM3QJd9HorrZGCt4LgLu",
      );

      const eosPublicKey = eosPrivatekey.toPublic();
      const pk = extractEosPublicKeyBytes(eosPublicKey.toString());

      if (!pk) {
        throw new Error("Invalid public key");
      }

      await createMigrationClaim({
        mint,
        userTokenAccount: ata,
        publicKey: pk,
        amount: 100_000_000,
        program,
        stakeStartTime: lastYear,
      });

      const { tx, session } =
        await createDummyEosTransactionWithMemo(originalMessage);

      const serializedTransactionBytes = tx.signingData(
        // eos mainnet chain id
        "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
      );

      const signature = await session.signTransaction(tx);

      const { stakeAccount } = await claimMigration({
        migrationProgram: program,
        stakeProgram,
        ata,
        mint,
        payer,
        foreignAddress: pk,
        signature: Buffer.from(signature[0].data.array),
        message: Buffer.from(serializedTransactionBytes.array),
      });

      // check if the stake account was created
      const stakeAccountData = await stakeProgram.account.stakeAccount.fetch(
        stakeAccount.publicKey,
      );

      expect(stakeAccountData).to.not.be.null;
      expect(stakeAccountData.amount.toNumber()).to.equal(100_000_000);
    });

    it.concurrent("correctly signs with keccak256", async () => {
      const { mint, ata } = await setup({ provider, payer });

      await createMigrationClaim({
        mint,
        userTokenAccount: ata,
        publicKey: toBytes(ethPublicKey),
        amount: 100_000_000,
        program,
        stakeStartTime: lastYear,
      });

      const ethPrivateKey =
        "d09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5";

      // keccak256 hash of the message
      const keccakHash = keccak256(Buffer.from(originalMessage));

      // sign the hash (without the 0x prefix)
      const sig = secp256k1.sign(keccakHash.slice(2), ethPrivateKey);

      // add the recovery byte to the signature
      const sigWithRecovery = Buffer.concat([
        sig.toCompactRawBytes(),
        Buffer.from([sig.recovery + 27]),
      ]);

      const { stakeAccount } = await claimMigration({
        migrationProgram: program,
        stakeProgram,
        ata,
        mint,
        payer,
        foreignAddress: toBytes(ethPublicKey),
        signature: sigWithRecovery,
        message: Buffer.from(originalMessage),
      });

      const stakeAccountData = await stakeProgram.account.stakeAccount.fetch(
        stakeAccount.publicKey,
      );

      expect(stakeAccountData).to.not.be.null;
      expect(stakeAccountData.amount.toNumber()).to.equal(100_000_000);
    });

    it.concurrent("correctly claims with eth_personal_sign", async () => {
      const { mint, ata } = await setup({ provider, payer });

      await createMigrationClaim({
        mint,
        userTokenAccount: ata,
        publicKey: toBytes(ethPublicKey),
        amount: 100_000_000,
        program,
        stakeStartTime: lastYear,
      });

      const account = privateKeyToAccount(
        "0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
      );
      const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
      const message = prefix + originalMessage;

      const signature = await account.signMessage({
        message: originalMessage,
      });

      const { stakeAccount } = await claimMigration({
        migrationProgram: program,
        stakeProgram,
        ata,
        mint,
        payer,
        foreignAddress: toBytes(ethPublicKey),
        signature: toBytes(signature),
        message: Buffer.from(message),
      });

      const stakeAccountData = await stakeProgram.account.stakeAccount.fetch(
        stakeAccount.publicKey,
      );

      expect(stakeAccountData).to.not.be.null;
      expect(stakeAccountData.amount.toNumber()).to.equal(100_000_000);
    });

    it.concurrent("can claim a stake with a valid signature", async () => {
      const { mint, ata } = await setup({ provider, payer });

      // get a unix_timestamp from 1 year ago
      const stakeStartTime = Math.floor(
        new Date().getTime() / 1000 - 365 * 24 * 60 * 60,
      );

      const account = privateKeyToAccount(
        "0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
      );

      const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
      const message = prefix + originalMessage;

      const signature = await account.signMessage({
        message: originalMessage,
      });

      const { vaultAccount: claimVaultAccount } = await createMigrationClaim({
        mint,
        userTokenAccount: ata,
        publicKey: toBytes(ethPublicKey),
        amount: 100_000_000,
        stakeStartTime,
        program,
      });

      const { stakeAccount, stakeVaultAccount, migrationAccount } =
        await claimMigration({
          migrationProgram: program,
          stakeProgram,
          ata,
          foreignAddress: toBytes(ethPublicKey),
          mint,
          payer,
          signature: Buffer.from(toBytes(signature)),
          message: Buffer.from(message),
        });

      // check if the stake account was created
      const stakeAccountData = await stakeProgram.account.stakeAccount.fetch(
        stakeAccount.publicKey,
      );

      expect(stakeAccountData).to.not.be.null;

      // check if the stake account has the correct start time (stake age)
      expect(stakeAccountData.stakeStartTime.toNumber()).to.equal(
        stakeStartTime,
      );

      // check if the stake vault account was created and has a balance
      const stakeVaultBalance =
        await provider.connection.getTokenAccountBalance(stakeVaultAccount);
      expect(stakeVaultBalance.value.uiAmount).to.be.greaterThan(0);

      // check if claim vault is closed
      await expect(() =>
        provider.connection.getTokenAccountBalance(claimVaultAccount),
      ).rejects.toThrowError("could not find account");

      // check if migration account is closed
      expect(provider.connection.getAccountInfo(migrationAccount)).resolves
        .toBeNull;
    });

    it.concurrent(
      "can claim a stake and topups an existing stake account",
      async () => {
        const { mint, ata } = await setup({ provider, payer });

        // get a unix_timestamp from 1 year ago
        const stakeStartTime = Math.floor(
          new Date().getTime() / 1000 - 365 * 24 * 60 * 60,
        );

        const account = privateKeyToAccount(
          "0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
        );

        const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
        const message = prefix + originalMessage;

        const signature = await account.signMessage({
          message: originalMessage,
        });

        const { vaultAccount: claimVaultAccount } = await createMigrationClaim({
          mint,
          userTokenAccount: ata,
          publicKey: toBytes(ethPublicKey),
          amount: 100_000_000,
          stakeStartTime,
          program,
        });

        const { stakeAccount, stakeVaultAccount } = await claimMigration({
          migrationProgram: program,
          stakeProgram,
          ata,
          mint,
          payer,
          foreignAddress: toBytes(ethPublicKey),
          signature: toBytes(signature),
          message: Buffer.from(message),
        });

        // check if the stake account was created
        const stakeAccountData = await stakeProgram.account.stakeAccount.fetch(
          stakeAccount.publicKey,
        );
        expect(stakeAccountData).to.not.be.null;
        // check if the stake account has the correct start time (stake age)
        expect(stakeAccountData.stakeStartTime.toNumber()).to.equal(
          stakeStartTime,
        );

        // check if the stake vault account was created and has a balance
        const stakeVaultBalance =
          await provider.connection.getTokenAccountBalance(stakeVaultAccount);
        expect(stakeVaultBalance.value.uiAmount).to.be.greaterThan(0);

        // check if claim vault is created and emptied out
        await expect(() =>
          provider.connection.getTokenAccountBalance(claimVaultAccount),
        ).rejects.toThrowError("could not find account");
      },
    );

    it.concurrent(
      "correctly throws a INVALID MESSAGE error when the message is incorrect",
      async () => {
        const { mint, ata } = await setup({ provider, payer });
        const { MESSAGE_INVALID } = useErrorsIDL(effect_migration);

        await createMigrationClaim({
          mint,
          userTokenAccount: ata,
          publicKey: toBytes(ethPublicKey),
          amount: 100_000_000,
          program,
          stakeStartTime: lastYear,
        });

        const account = privateKeyToAccount(
          "0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
        );

        const signature = await account.signMessage({
          message: originalMessage,
        });

        expectAnchorError(async () => {
          await claimMigration({
            migrationProgram: program,
            stakeProgram,
            ata,
            mint,
            payer,
            foreignAddress: toBytes(ethPublicKey),
            signature: Buffer.from(toBytes(signature)),
            message: Buffer.from("wroong"),
          });
        }, MESSAGE_INVALID);
      },
    );

    it.concurrent(
      "correctly throws a PUBLIC_KEY_MISMATCH when signing a different message",
      async () => {
        const { mint, ata } = await setup({ provider, payer });
        const { PUBLIC_KEY_MISMATCH } = useErrorsIDL(effect_migration);

        await createMigrationClaim({
          mint,
          userTokenAccount: ata,
          publicKey: toBytes(ethPublicKey),
          amount: 100_000_000,
          program,
          stakeStartTime: lastYear,
        });

        const account = privateKeyToAccount(
          "0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
        );

        const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
        const message = prefix + originalMessage;

        const signature = await account.signMessage({
          message: "wrong",
        });

        expectAnchorError(async () => {
          await claimMigration({
            migrationProgram: program,
            stakeProgram,
            ata,
            mint,
            payer,
            foreignAddress: toBytes(ethPublicKey),
            signature: Buffer.from(toBytes(signature)),
            message: Buffer.from(message),
          });
        }, PUBLIC_KEY_MISMATCH);
      },
    );
  });

  describe("Migration Contract: Destroy", () => {
    it("can destroy a migration account", async () => {
      const { mint, ata } = await setup({ provider, payer });

      const { migrationAccount } = await createMigrationClaim({
        stakeStartTime: lastYear,
        mint,
        userTokenAccount: ata,
        publicKey: toBytes(ethPublicKey),
        amount: 100_000_000,
        program,
      });

      const balanceBefore =
        await provider.connection.getTokenAccountBalance(ata);

      if (!balanceBefore.value.uiAmount) {
        throw new Error("Could not get balance");
      }

      await program.methods
        .destroyClaim()
        .accounts({
          mint,
          userTokenAccount: ata,
          migrationAccount,
        })
        .rpc();

      const migrationAccountData =
        await provider.connection.getAccountInfo(migrationAccount);
      expect(migrationAccountData).toBeNull();

      // expect to have received the tokens back on the ATA
      const balanceAfter =
        await provider.connection.getTokenAccountBalance(ata);

      // expect the balance after to be +100_000_000
      expect(balanceAfter.value.uiAmount).to.equal(
        balanceBefore.value.uiAmount + 100,
      );
    });
  });
});
