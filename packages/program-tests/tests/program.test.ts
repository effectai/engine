import { it, describe, expect, beforeAll, afterAll } from "vitest";
import { deploy, type Program } from "../../../tools/scripts/solana/validator";
import { setup } from "@effectai/test-utils";
import {
  getInitInstructionAsync,
  getRedeemInstruction,
  getCreatePaymentPoolInstructionAsync,
  EFFECT_PAYMENT_PROGRAM_ADDRESS,
} from "@effectai/payment";
import {
  generateKeyPairSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  SolanaError,
  type KeyPairSigner,
} from "@solana/kit";
import { connect } from "solana-kite";
import {
  EFFECT_STAKING_PROGRAM_ADDRESS,
  getStakeInstructionAsync,
  getUpdateAuthorityInstruction,
} from "@effectai/staking";

import {
  getInitInstructionAsync as getInitRewardInstructionAsync,
  getInitIntermediaryVaultInstructionAsync,
  getEnterInstructionAsync,
  getClaimInstructionAsync,
  EFFECT_REWARD_PROGRAM_ADDRESS,
} from "@effectai/reward";

import { getTransferCheckedInstruction } from "@solana-program/token";

describe("Placeholder test", () => {
  let validator: any;
  let connection: ReturnType<typeof connect>;
  let wallet: KeyPairSigner;

  beforeAll(async () => {
    const port = 8884;
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

      const dummyManager = await generateKeyPairSigner();
      const applicationPubkey = await generateKeyPairSigner();
      const stakeAccount = await generateKeyPairSigner();

      //create payment account
      const createPaymentIx = await getCreatePaymentPoolInstructionAsync({
        mint,
        managerAuthority: dummyManager.address,
        amount: 1_000_000n,
        userTokenAccount: ata,
        applicationPubkey: applicationPubkey.address,
        authority: wallet,
      });

      const initIx = await getInitInstructionAsync({
        applicationPubkey: applicationPubkey.address,
        authority: wallet,
        mint,
        managerAuthority: dummyManager.address,
      });

      const [recipientManagerDataAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
        seeds: [
          getAddressEncoder().encode(wallet.address),
          getAddressEncoder().encode(dummyManager.address),
          getAddressEncoder().encode(applicationPubkey.address),
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
        scope: applicationPubkey.address,
      });

      //update stake ix to the recipientManagerDataAccount
      const updateAuthorityIx = getUpdateAuthorityInstruction({
        stakingAccount: stakeAccount.address,
        newAuthority: recipientManagerDataAccount,
        authority: wallet,
      });

      const [stakeVaultTokenAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
        seeds: [getAddressEncoder().encode(stakeAccount.address)],
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
        scope: applicationPubkey.address,
      });

      //get reward vault token account
      const [reflectionAccount] = await getProgramDerivedAddress({
        programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
        seeds: [
          Buffer.from("reflection", "utf-8"),
          getAddressEncoder().encode(mint),
          getAddressEncoder().encode(applicationPubkey.address),
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
        const tx = await connection.sendTransactionFromInstructions({
          instructions: [
            createPaymentIx,
            initIx,
            stakeIx,
            updateAuthorityIx,
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
    { timeout: 20000 },
  );
});
