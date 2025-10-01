import { it, describe, expect, beforeAll, afterAll } from "vitest";
import { deploy, type Program } from "../../../tools/scripts/solana/validator";
import { setup } from "@effectai/test-utils";
import {
  getInitInstructionAsync,
  getRedeemInstruction,
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
  createKeyPairSignerFromPrivateKeyBytes,
  generateKeyPairSigner,
  getAddressDecoder,
  getAddressEncoder,
  getProgramDerivedAddress,
  SolanaError,
  type KeyPairSigner,
} from "@solana/kit";
import { connect } from "solana-kite";
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
import { getRegisterInstruction } from "@effectai/application";
import { randomBytes } from "node:crypto";

describe("Placeholder test", () => {
  let validator: any;
  let connection: ReturnType<typeof connect>;
  let wallet: KeyPairSigner;

  beforeAll(async () => {
    const port = 8882;
    const programs: Program[] = [
      {
        so: "../../target/deploy/effect_payment.so",
        keypair: "../../target/deploy/effect_payment-keypair.json",
      },
      {
        so: "../../target/deploy/effect_staking.so",
        keypair: "../../target/deploy/effect_staking-keypair.json",
      },
      {
        so: "../../target/deploy/effect_reward.so",
        keypair: "../../target/deploy/effect_reward-keypair.json",
      },
      {
        so: "../../target/deploy/effect_application.so",
        keypair: "../../target/deploy/effect_application-keypair.json",
      },
    ];

    validator = await deploy(port, programs);

    connection = connect(
      `http://localhost:${port}`,
      `ws://localhost:${port + 1}`,
    );

    wallet = await connection.loadWalletFromFile("./.keys/test.json");
  }, 30000);

  afterAll(() => {
    if (validator) {
      validator.kill("SIGINT", { forceKillAfterTimeout: 2000 });
    }
  });

  it(
    "should redeem payments into stake account",
    async () => {
      const { mint, ata } = await setup(connection, wallet);

      const privateKeyBytes = randomBytes(32);
      const eddsa = await buildEddsa();
      const uPublicKey = eddsa.prv2pub(privateKeyBytes);
      const publicKey = eddsa.babyJub.packPoint(uPublicKey);

      //create address from bytes
      const managerPublicKey = getAddressDecoder().decode(publicKey);
      const applicationAccount = await generateKeyPairSigner();
      const stakeAccount = await generateKeyPairSigner();

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

      const proofResult = await generatePaymentProof({
        recipient: wallet.address.toString(),
        publicKey: managerPublicKey,
        paymentAccount: paymentAccount.toString(),
        payments: signedPayments,
      });

      //register our app
      const registerIx = getRegisterInstruction({
        authority: wallet,
        name: "Test App",
        description: "This is a test app",
        applicationAccount,
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

      const initIx = await getInitInstructionAsync({
        applicationAccount: applicationAccount.address,
        authority: wallet,
        mint,
        managerAuthority: managerPublicKey,
      });

      const [recipientManagerDataAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          getAddressEncoder().encode(wallet.address),
          getAddressEncoder().encode(managerPublicKey),
          getAddressEncoder().encode(applicationAccount.address),
          getAddressEncoder().encode(mint),
        ],
      });

      const stakeIx = await getStakeInstructionAsync({
        authority: wallet,
        duration: 30 * 24 * 60 * 60, // 30 days
        mint,
        amount: 0n,
        userTokenAccount: ata,
        stakeAccount: stakeAccount,
        scope: applicationAccount.address,
      });

      const [stakeVaultTokenAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
        seeds: [getAddressEncoder().encode(stakeAccount.address)],
      });

      const claimProofIx = await getClaimProofsInstructionAsync({
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
      });

      const redeemIx = getRedeemInstruction({
        stakeVaultTokenAccount,
        userTokenAccount: ata,
        recipientManagerDataAccount,
        authority: wallet,
        mint,
        stakeAccount: stakeAccount.address,
      });

      //initReflection
      const initReflectionIx = await getInitRewardInstructionAsync({
        authority: wallet,
        mint,
        scope: applicationAccount.address,
      });

      //get reward vault token account
      const [reflectionAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
        seeds: [
          Buffer.from("reflection", "utf-8"),
          getAddressEncoder().encode(mint),
          getAddressEncoder().encode(applicationAccount.address),
        ],
      });

      const [reflectionVaultAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
        seeds: [getAddressEncoder().encode(reflectionAccount)],
      });

      //send 500 tokens to the reflection vault account
      const transferTokensIx = getTransferCheckedInstruction({
        source: ata,
        destination: reflectionVaultAccount,
        mint,
        authority: wallet,
        amount: 500n,
        decimals: 6,
      });

      const enterRewardIx = await getEnterInstructionAsync({
        authority: wallet,
        reflectionAccount,
        stakeAccount: stakeAccount.address,
        mint,
      });

      const claimIx = await getClaimInstructionAsync({
        authority: wallet,
        recipientTokenAccount: ata,
        reflectionAccount,
        stakeAccount: stakeAccount.address,
      });

      try {
        await connection.sendTransactionFromInstructions({
          instructions: [registerIx, createPaymentIx, initIx, claimProofIx],
          feePayer: wallet,
        });

        await connection.sendTransactionFromInstructions({
          instructions: [
            stakeIx,
            redeemIx,
            initReflectionIx,
            transferTokensIx,
            enterRewardIx,
            claimIx,
          ],
          feePayer: wallet,
        });

        //assert that we have claimed 500 tokens
        const balance = await connection.getTokenAccountBalance({
          tokenAccount: ata,
        });

        expect(balance.uiAmount?.toString(), "500");
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
