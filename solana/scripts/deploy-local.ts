// deploy script for local environment
import * as anchor from "@coral-xyz/anchor";
import { mintToAccount, setup } from "../utils/spl";
import { PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccount } from "@solana/spl-token";
import rewardIDL from "../target/idl/effect_rewards.json";
import type { EffectRewards } from "../target/types/effect_rewards";
import type { Program } from "@coral-xyz/anchor";
import { spawn } from "child_process";
import { createKeypairFromFile } from "@effectai/utils";

const createReflectionAcount = async ({
  mint,
  ata,
}: {
  mint: PublicKey;
  ata: PublicKey;
}) => {
  // load anchor wallet
  const provider = anchor.AnchorProvider.local();

  const program = new anchor.Program(
    rewardIDL as anchor.Idl,
    provider
  ) as unknown as Program<EffectRewards>;

  await program.methods
    .init()
    .accounts({
      mint,
    })
    .rpc();

  await program.methods.initIntermediaryVault().accounts({ mint }).rpc();

  const [reflectionAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("reflection"), mint.toBuffer()],
    program.programId
  );

  const [reflectionVault] = PublicKey.findProgramAddressSync(
    [reflectionAccount.toBuffer()],
    program.programId
  );

  const [intermediaryReflectionVaultAccount] = PublicKey.findProgramAddressSync(
    [reflectionVault.toBuffer()],
    program.programId
  );

  return [
    reflectionAccount,
    reflectionVault,
    intermediaryReflectionVaultAccount,
  ];
};

const seed = async () => {
  const anchorWallet = process.env.ANCHOR_WALLET;

  if (!anchorWallet) {
    throw new Error("ANCHOR_WALLET env variable is not set");
  }

  const provider = anchor.AnchorProvider.local();

  const tx = await provider.connection.requestAirdrop(
    provider.wallet.publicKey,
    1000000000000
  );

  await provider.connection.confirmTransaction(tx);

  const wallet = provider.wallet;
  const payer = (wallet as anchor.Wallet).payer;

  const mintKeypair = await createKeypairFromFile(
    "./tests/keys/mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P.json"
  );

  const { mint, ata } = await setup({
    payer,
    provider,
    amount: 50000000_000_000,
    mintKeypair,
  });

  // also mint some tokens to the dummy account for staking

  // create reflection account
  const [
    reflectionAccount,
    reflectionVault,
    intermediaryReflectionVaultAccount,
  ] = await createReflectionAcount({
    mint,
    ata,
  });

  console.log("reflection account", reflectionAccount.toBase58());
  console.log(
    "intermediaryReflectionVaultAccount",
    intermediaryReflectionVaultAccount.toBase58()
  );
};

// deploy
const args1 = ["deploy", "--provider.cluster", "localnet"];

// start a new ledger
const deploy = (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const deploy = spawn(command, args);

    deploy.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    deploy.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    deploy.on("close", (code) => {
      if (code === 0) {
        console.log(`child process exited with code ${code}`);
        resolve();
      } else {
        reject(new Error(`child process exited with code ${code}`));
      }
    });

    deploy.on("error", (err) => {
      reject(err); // In case spawn fails to start the process
    });
  });
};

// kill current solana-test-validator
try {
  console.log("killing current solana-test-validator");
  await new Promise((resolve, reject) => {
    const deploy = spawn("killall", ["solana-test-validator"]);

    deploy.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
      resolve(void 0);
    });

    deploy.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    deploy.on("close", (code) => {
      if (code === 0) {
        console.log(`child process exited with code ${code}`);
        resolve(void 0);
      } else {
        reject(new Error(`child process exited with code ${code}`));
      }
    });

    deploy.on("error", (err) => {
      reject(err); // In case spawn fails to start the process
    });
  });
} catch (e) {
  console.log(e);
}

await new Promise((resolve, reject) => {
  const deploy = spawn("solana-test-validator", ["--quiet", "--reset"]);

  deploy.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    resolve(void 0);
  });

  deploy.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  deploy.on("close", (code) => {
    if (code === 0) {
      console.log(`child process exited with code ${code}`);
      resolve(void 0);
    } else {
      reject(new Error(`child process exited with code ${code}`));
    }
  });

  deploy.on("error", (err) => {
    reject(err); // In case spawn fails to start the process
  });
});

// wait for the programs to deploy
await Promise.all([deploy("anchor", args1)]);

// seed the accounts
await seed();
