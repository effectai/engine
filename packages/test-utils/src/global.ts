import { startValidator, stopValidator } from "./validator-docker";
import { deployProgram } from "./deploy";
import path from "path";

export default async function setup() {
  await startValidator();

  const programs = [
    {
      name: "payments",
      soPath: path.resolve(
        __dirname,
        "../packages/payments/target/deploy/payments.so",
      ),
      keypairPath: path.resolve(
        __dirname,
        "../packages/payments/target/deploy/payments-keypair.json",
      ),
    },
    {
      name: "staking",
      soPath: path.resolve(
        __dirname,
        "../packages/staking/target/deploy/staking.so",
      ),
      keypairPath: path.resolve(
        __dirname,
        "../packages/staking/target/deploy/staking-keypair.json",
      ),
    },
  ];

  for (const { soPath, keypairPath } of programs) {
    await deployProgram(soPath, keypairPath);
  }

  // Make connection details globally available
  globalThis.validatorUrl = "http://localhost:8899";
}

export async function teardown() {
  await stopValidator();
}
