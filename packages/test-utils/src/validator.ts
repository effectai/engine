import { spawn, ChildProcessWithoutNullStreams } from "child_process";

let validator: ChildProcessWithoutNullStreams;

export async function startValidator(): Promise<void> {
  return new Promise((resolve, reject) => {
    validator = spawn("solana-test-validator", ["--reset", "--quiet"]);

    validator.stdout.on("data", (data) => {
      if (data.toString().includes("RPC URL")) {
        resolve();
      }
    });

    validator.stderr.on("data", (data) => {
      console.error(`[validator error]`, data.toString());
    });

    validator.on("exit", (code) => {
      console.log(`Validator exited with code ${code}`);
    });

    setTimeout(() => reject(new Error("Validator startup timed out")), 5000);
  });
}

export async function stopValidator() {
  if (validator) validator.kill("SIGTERM");
}
