import { execa } from "execa";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";
import path from "node:path";
import http from "node:http";
import fs from "node:fs";

export type Program = {
  so: string;
  keypair: string;
};

type ValidatorHandle = {
  pid: number;
  kill: () => void;
};

async function run(
  cmd: string,
  args: string[],
  env: Record<string, string> = {},
) {
  await execa(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } });
}

export async function deploy(port: number, programs: Program[]) {
  const LEDGER_DIR = ".ledger-test";
  const RPC_URL = `http://127.0.0.1:${port}`;
  const RPC_PORT = port;

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

  async function waitForHealth(timeoutMs = 30_000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await rpc("getHealth");
        if (res?.result === "ok") return;
      } catch (_) {}
      await sleep(250);
    }
    throw new Error("Validator did not become healthy in time");
  }

  async function startValidator(programs: Program[]) {
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
      ].concat(programs.flatMap((p) => ["--bpf-program", p.keypair, p.so])),
      { stdout: "pipe", stderr: "pipe" },
    );

    await waitForHealth(30_000);

    const handle: ValidatorHandle = {
      pid: child.pid!,
      kill: () => child.kill("SIGINT"),
    };

    return handle;
  }

  const validator = await startValidator(programs);

  let exitCode = 0;
  try {
    await run(
      "solana-keygen",
      ["new", "--no-passphrase", "--force", "-s", "-o", ".keys/test.json"],
      {},
    );

    // fund
    await run("solana", [
      "airdrop",
      "100",
      "--url",
      RPC_URL,
      "--keypair",
      ".keys/test.json",
    ]);

    return validator;
  } catch (e) {
    console.error(e);
    exitCode = 1;
  }
}
