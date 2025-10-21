import { afterAll, beforeAll } from "vitest";
import { deploy, type Program } from "../../tools/scripts/solana/validator";
import { connect } from "solana-kite";

let validator: any;

globalThis.__connection__ = undefined;
globalThis.__wallet__ = undefined;

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
    {
      so: "../../target/deploy/effect_application.so",
      keypair: "../../target/deploy/effect_application-keypair.json",
    },
    {
      so: "../../target/deploy/effect_payment.so",
      keypair: "../../target/deploy/effect_payment-keypair.json",
    },
  ];

  validator = await deploy(port, programs);

  const connection = connect(
    `http://localhost:${port}`,
    `ws://localhost:${port + 1}`,
  );

  globalThis.__connection__ = connection;
  globalThis.__wallet__ =
    await connection.loadWalletFromFile("./.keys/test.json");
}, 30000);

afterAll(() => {
  if (validator) {
    validator.kill("SIGINT", { forceKillAfterTimeout: 2000 });
  }

  globalThis.__connection__ = undefined;
});
