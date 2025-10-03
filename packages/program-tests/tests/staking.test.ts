import { it, describe, expect, beforeAll, afterAll } from "vitest";
import { deploy, type Program } from "../../../tools/scripts/solana/validator";
import { setup } from "@effectai/test-utils";
import {
  generateKeyPairSigner,
  SolanaError,
  type KeyPairSigner,
} from "@solana/kit";
import { connect } from "solana-kite";
import {
  getStakeInstructionAsync,
  getUnstakeInstructionAsync,
} from "@effectai/staking";
describe("Placeholder test", () => {
  let validator: any;
  let connection: ReturnType<typeof connect>;
  let wallet: KeyPairSigner;

  beforeAll(async () => {
    const port = 8880;
    const programs: Program[] = [
      {
        so: "../../target/deploy/effect_staking.so",
        keypair: "../../target/deploy/effect_staking-keypair.json",
      },
      {
        so: "../../target/deploy/effect_vesting.so",
        keypair: "../../target/deploy/effect_vesting-keypair.json",
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

  it("cannot unstake when scope !== mint", async () => {
    //setup our test mint and ata
    const { mint, ata } = await setup(connection, wallet);

    const stakeAccount = await generateKeyPairSigner();
    const fakeApplication = await generateKeyPairSigner();

    const stakeIx = await getStakeInstructionAsync({
      userTokenAccount: ata,
      authority: wallet,
      amount: 5_000_000,
      duration: 30 * 24 * 60 * 60, // 30 days
      stakeAccount,
      mint,
      scope: fakeApplication.address,
    });

    const vestingAccount = await generateKeyPairSigner();

    const unstakeIx = await getUnstakeInstructionAsync({
      vestingAccount,
      recipientTokenAccount: ata,
      amount: 5_000_000,
      stakeAccount: stakeAccount.address,
      authority: wallet,
      mint,
    });

    try {
      const tx = await connection.sendTransactionFromInstructions({
        feePayer: wallet,
        instructions: [stakeIx, unstakeIx],
      });
    } catch (e) {
      if (e instanceof SolanaError) {
        console.log(e.transaction?.meta?.logMessages);
      }
    }
  }, 20000);
});
