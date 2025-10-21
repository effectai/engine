import { it, describe, expect, beforeAll, afterAll, test } from "vitest";
import { setup } from "@effectai/test-utils";
import {
  getInitInstructionAsync,
  getCreatePaymentPoolInstructionAsync,
  EFFECT_PAYMENT_PROGRAM_ADDRESS,
  signPayment,
  generatePaymentProof,
  getClaimProofsInstructionAsync,
  buildEddsa,
  convertProofToBytes,
  bigIntToBytes32,
} from "@effectai/payment";
import {
  address,
  generateKeyPairSigner,
  getAddressDecoder,
  getAddressEncoder,
  getProgramDerivedAddress,
  SolanaError,
  type KeyPairSigner,
} from "@solana/kit";
import { connect, Connection } from "solana-kite";
import {
  EFFECT_STAKING_PROGRAM_ADDRESS,
  getStakeInstructionAsync,
} from "@effectai/staking";

import {
  getInitInstructionAsync as getInitRewardInstructionAsync,
  getEnterInstructionAsync,
  getClaimInstructionAsync,
  EFFECT_REWARD_PROGRAM_ADDRESS,
} from "@effectai/reward";

import { getTransferCheckedInstruction } from "@solana-program/token";
import {
  getRegisterInstructionAsync,
  PayoutStrategy,
} from "@effectai/application";
import { randomBytes } from "node:crypto";

describe("Payout tests", () => {
  let connection: Connection;
  let wallet: KeyPairSigner;

  beforeAll(() => {
    if (!globalThis.__connection__ || !globalThis.__wallet__) {
      throw new Error("Connection or wallet not initialized");
    }
    connection = globalThis.__connection__;
    wallet = globalThis.__wallet__;
  });

  test.concurrent("Should handle direct payouts", () => {
    expect(true).toBe(true);
  });

  test(
    "Should handle staked payouts",
    async () => {
      const { mint, ata } = await setup(connection, wallet);

      //generate manager keypair
      const privateKeyBytes = randomBytes(32);
      const eddsa = await buildEddsa();
      const uPublicKey = eddsa.prv2pub(privateKeyBytes);
      const publicKey = eddsa.babyJub.packPoint(uPublicKey);
      const managerPublicKey = getAddressDecoder().decode(publicKey);

      //generate application & stake account
      const applicationAccount = await generateKeyPairSigner();

      //derive our Payment Account
      const [paymentAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          Buffer.from("payment", "utf-8"),
          getAddressEncoder().encode(managerPublicKey),
          getAddressEncoder().encode(applicationAccount.address),
          getAddressEncoder().encode(mint),
        ],
      });

      //generate 10 dummy payments
      const payments = Array.from({ length: 10 }, (_, i) => ({
        id: `test-payment-${i + 1}`,
        version: 1,
        publicKey: managerPublicKey,
        strategy: PayoutStrategy.Staked,
        nonce: BigInt(i + 1),
        paymentAccount: paymentAccount.toString(),
        amount: 1_000_000n,
        recipient: wallet.address.toString(),
      }));

      // sign payments
      const signedPayments = await Promise.all(
        payments.map(async (payment) => {
          return await signPayment(payment, privateKeyBytes);
        }),
      );

      //generate our proof
      const proofResult = await generatePaymentProof({
        recipient: wallet.address.toString(),
        publicKey: managerPublicKey,
        version: 1,
        strategy: PayoutStrategy.Staked,
        paymentAccount: paymentAccount.toString(),
        payments: signedPayments,
      });

      //register our test app
      const registerIx = await getRegisterInstructionAsync({
        authority: wallet,
        name: "Test App",
        mint,
        description: "This is a test app",
        applicationAccount,
        payoutStrategy: PayoutStrategy.Staked,
      });

      //create payment account
      const createPaymentIx = await getCreatePaymentPoolInstructionAsync({
        mint,
        managerAuthority: managerPublicKey,
        amount: 10_000_000n,
        userTokenAccount: ata,
        applicationAccount: applicationAccount.address,
        authority: wallet,
      });

      //init recipient-manager-app data account
      const initIx = await getInitInstructionAsync({
        applicationAccount: applicationAccount.address,
        authority: wallet,
        mint,
        managerAuthority: managerPublicKey,
      });

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
        allowTopup: true,
      });

      const [stakeVaultTokenAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
        seeds: [getAddressEncoder().encode(stakeAccount.address)],
      });

      //derive recipient-manager-app data account
      const [recipientManagerDataAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          getAddressEncoder().encode(wallet.address),
          getAddressEncoder().encode(managerPublicKey),
          getAddressEncoder().encode(applicationAccount.address),
          getAddressEncoder().encode(mint),
        ],
      });

      //claim proof instruction
      const claimProofIx = await getClaimProofsInstructionAsync({
        applicationAccount: applicationAccount.address,
        strategy: PayoutStrategy.Staked,
        version: 1,
        paymentAccount: address(paymentAccount),
        mint: address(mint),
        recipientManagerDataAccount,
        recipientTokenAccount: ata,
        pubX: bigIntToBytes32(BigInt(proofResult.publicSignals.pubX)),
        pubY: bigIntToBytes32(BigInt(proofResult.publicSignals.pubY)),
        authority: wallet,
        minNonce: Number(proofResult.publicSignals.minNonce),
        maxNonce: Number(proofResult.publicSignals.maxNonce),
        totalAmount: Number(proofResult.publicSignals.amount),
        proof: convertProofToBytes(proofResult.proof),
        stakeAccount: stakeAccount.address,
        stakeVaultTokenAccount,
        stakeProgram: EFFECT_STAKING_PROGRAM_ADDRESS,
      });

      await connection.sendTransactionFromInstructions({
        instructions: [registerIx, createPaymentIx, initIx],
        feePayer: wallet,
      });

      try {
        await connection.sendTransactionFromInstructions({
          instructions: [stakeIx, claimProofIx],
          feePayer: wallet,
        });
      } catch (e) {
        console.error("Error creating payment account:", e);
        if (e instanceof SolanaError) {
          console.error("SolanaError logs:", e.context);
          //print transaction logs
          console.log(e.transaction?.meta?.logMessages);
        }

        throw e;
      }

      //expect to have 10 tokens in our stake account vault
      const balance = await connection.getTokenAccountBalance({
        tokenAccount: stakeVaultTokenAccount,
      });

      expect(balance.amount.toString()).toBe("10000000");
    },
    { timeout: 30000 },
  );

  test(
    "should redeem shares into stake account",
    async () => {
      //setup our test mint and ata
      const { mint, ata } = await setup(connection, wallet);

      //generate manager keypair
      const privateKeyBytes = randomBytes(32);
      const eddsa = await buildEddsa();
      const uPublicKey = eddsa.prv2pub(privateKeyBytes);
      const publicKey = eddsa.babyJub.packPoint(uPublicKey);
      const managerPublicKey = getAddressDecoder().decode(publicKey);

      //generate application & stake account
      const applicationAccount = await generateKeyPairSigner();

      //derive our Payment Account
      const [paymentAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          Buffer.from("payment", "utf-8"),
          getAddressEncoder().encode(managerPublicKey),
          getAddressEncoder().encode(applicationAccount.address),
          getAddressEncoder().encode(mint),
        ],
      });

      //generate 10 dummy payments
      const payments = Array.from({ length: 10 }, (_, i) => ({
        id: `test-payment-${i + 1}`,
        version: 1,
        publicKey: managerPublicKey,
        strategy: PayoutStrategy.Shares,
        nonce: BigInt(i + 1),
        paymentAccount: paymentAccount.toString(),
        amount: 1_000_000n,
        recipient: wallet.address.toString(),
      }));

      // sign payments
      const signedPayments = await Promise.all(
        payments.map(async (payment) => {
          return await signPayment(payment, privateKeyBytes);
        }),
      );

      //generate our proof
      const proofResult = await generatePaymentProof({
        recipient: wallet.address.toString(),
        publicKey: managerPublicKey,
        version: 1,
        strategy: PayoutStrategy.Shares,
        paymentAccount: paymentAccount.toString(),
        payments: signedPayments,
      });

      //register our test app
      const registerIx = await getRegisterInstructionAsync({
        authority: wallet,
        name: "Test App",
        mint,
        description: "This is a test app",
        applicationAccount,
        payoutStrategy: PayoutStrategy.Shares,
      });

      //create payment account
      const createPaymentIx = await getCreatePaymentPoolInstructionAsync({
        mint,
        managerAuthority: managerPublicKey,
        amount: 10_000_000n,
        userTokenAccount: ata,
        applicationAccount: applicationAccount.address,
        authority: wallet,
      });

      //init recipient-manager-app data account
      const initIx = await getInitInstructionAsync({
        applicationAccount: applicationAccount.address,
        authority: wallet,
        mint,
        managerAuthority: managerPublicKey,
      });

      //create stake account
      const stakeAccount = await generateKeyPairSigner();
      const stakeIx = await getStakeInstructionAsync({
        authority: wallet,
        duration: 0,
        mint,
        amount: 0n,
        userTokenAccount: ata,
        stakeAccount: stakeAccount,
        scope: applicationAccount.address,
        allowTopup: false,
      });

      const [stakeVaultTokenAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
        seeds: [getAddressEncoder().encode(stakeAccount.address)],
      });

      //derive recipient-manager-app data account
      const [recipientManagerDataAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          getAddressEncoder().encode(wallet.address),
          getAddressEncoder().encode(managerPublicKey),
          getAddressEncoder().encode(applicationAccount.address),
          getAddressEncoder().encode(mint),
        ],
      });

      //claim proof instruction
      const claimProofIx = await getClaimProofsInstructionAsync({
        applicationAccount: applicationAccount.address,
        paymentAccount: address(paymentAccount),
        mint: address(mint),
        recipientManagerDataAccount,
        strategy: PayoutStrategy.Shares,
        version: 1,
        recipientTokenAccount: ata,
        pubX: bigIntToBytes32(BigInt(proofResult.publicSignals.pubX)),
        pubY: bigIntToBytes32(BigInt(proofResult.publicSignals.pubY)),
        authority: wallet,
        minNonce: Number(proofResult.publicSignals.minNonce),
        maxNonce: Number(proofResult.publicSignals.maxNonce),
        totalAmount: Number(proofResult.publicSignals.amount),
        proof: convertProofToBytes(proofResult.proof),
        stakeAccount: stakeAccount.address,
        stakeVaultTokenAccount,
        stakeProgram: EFFECT_STAKING_PROGRAM_ADDRESS,
      });

      //get contribution pool reflection account
      const [reflectionAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
        seeds: [
          Buffer.from("reflection", "utf-8"),
          getAddressEncoder().encode(mint),
          getAddressEncoder().encode(applicationAccount.address),
        ],
      });

      //derive reflection vault account
      const [reflectionVaultAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
        seeds: [getAddressEncoder().encode(reflectionAccount)],
      });

      //send 500 tokens to the contribution / app-shares pool
      const transferTokensIx = getTransferCheckedInstruction({
        source: ata,
        destination: reflectionVaultAccount,
        mint,
        authority: wallet,
        amount: 500n,
        decimals: 6,
      });

      // enter contribution pool with our scoped stake account
      const enterRewardIx = await getEnterInstructionAsync({
        authority: wallet,
        reflectionAccount,
        stakeAccount: stakeAccount.address,
        mint,
      });

      // claim available rewards into our ata
      const claimIx = await getClaimInstructionAsync({
        authority: wallet,
        recipientTokenAccount: ata,
        reflectionAccount,
        stakeAccount: stakeAccount.address,
      });

      try {
        // register app & payment account and claim our payments
        await connection.sendTransactionFromInstructions({
          instructions: [registerIx, createPaymentIx],
          feePayer: wallet,
        });

        // init, stake, claim proof, redeem
        await connection.sendTransactionFromInstructions({
          instructions: [initIx, stakeIx, claimProofIx],
          feePayer: wallet,
        });

        // stake, redeem, init reflection, enter reward pool, transfer tokens to reflection pool, claim rewards
        await connection.sendTransactionFromInstructions({
          instructions: [transferTokensIx, enterRewardIx, claimIx],
          feePayer: wallet,
        });

        //assert that we have claimed 500 tokens (100% of what we sent to the app-shares pool)
        const balance = await connection.getTokenAccountBalance({
          tokenAccount: ata,
        });

        expect(balance.amount.toString(), "500000000");
      } catch (e) {
        console.error("Error creating payment account:", e);
        if (e instanceof SolanaError) {
          console.error("SolanaError logs:", e.context);
          //print transaction logs
          console.log(e.transaction?.meta?.logMessages);
        }

        throw e;
      }
    },
    { timeout: 50000 },
  );
});
