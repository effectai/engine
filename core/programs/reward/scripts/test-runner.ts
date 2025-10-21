import { execa } from "execa";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";

const LEDGER_DIR = ".ledger-test";
const RPC_PORT = "8899";
const RPC_URL = `http://127.0.0.1:${RPC_PORT}`;
const PROGRAM_SO = path.resolve("./../../target/deploy/effect_reward.so");
const PROGRAM_KEYPAIR = path.resolve(
  "./../../target/deploy/effect_reward-keypair.json",
);

function rpc(method: string, params: any[] = []) {
  const payload = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  return new Promise<any>((resolve, reject) => {
    const req = http.request(
      RPC_URL,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            resolve(body);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function waitForHealth(timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      console.log("checking validator health...");
      const res = await rpc("getHealth");
      if (res?.result === "ok") return;
    } catch (_) {}
    await sleep(250);
  }
  throw new Error("Validator did not become healthy in time");
}

type ValidatorHandle = {
  pid: number;
  kill: () => void;
};

async function startValidator() {
  if (fs.existsSync(LEDGER_DIR))
    fs.rmSync(LEDGER_DIR, { recursive: true, force: true });

  const child = execa(
    "solana-test-validator",
    [
      "--reset",
      "--ledger",
      LEDGER_DIR,
      "--rpc-port",
      String(RPC_PORT),
      "--limit-ledger-size",
      "500",
      "--quiet",
    ],
    { stdout: "pipe", stderr: "pipe" },
  );

  await waitForHealth(20_000);

  const handle: ValidatorHandle = {
    pid: child.pid!,
    kill: () => child.kill("SIGINT"),
  };

  return handle;
}

async function run(
  cmd: string,
  args: string[],
  env: Record<string, string> = {},
) {
  await execa(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
}

async function main() {
  const validator = await startValidator();
  let exitCode = 0;
  try {
    console.log("Airdropping to faucet");
    // point CLI to local RPC
    await run("solana", ["config", "set", "-u", "localhost"]);

    // ensure keypair exists
    await run(
      "solana-keygen",
      ["new", "--no-passphrase", "--force", "-s", "-o", ".keys/test.json"],
      {},
    );

    await run("solana", ["config", "set", "-k", ".keys/test.json"]);

    // fund
    await run("solana", ["airdrop", "100"]);

    await run("solana", [
      "program",
      "deploy",
      "--program-id",
      PROGRAM_KEYPAIR,
      PROGRAM_SO,
    ]);

    console.log("Program deployed");

    await run("pnpm", ["vitest", "run"]);
  } catch (e) {
    console.error(e);
    exitCode = 1;
  } finally {
    // teardown validator
    validator.kill("SIGINT", { forceKillAfterTimeout: 2000 });
    process.exit(exitCode);
  }
}

main();
