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
import {
  getRegisterInstructionAsync,
  PayoutStrategy,
} from "@effectai/application";
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
