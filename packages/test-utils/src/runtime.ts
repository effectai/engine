import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

let validatorProcess: ChildProcessWithoutNullStreams | null = null;

export function startTestValidator(args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullArgs = ["--reset", "--quiet", ...args];
    validatorProcess = spawn("solana-test-validator", fullArgs);

    validatorProcess.stdout.on("data", (data) => {
      const output = data.toString();
      if (output.includes("RPC URL")) {
        resolve();
      }
    });

    validatorProcess.stderr.on("data", (data) => {
      console.error(`[validator error]: ${data}`);
    });

    validatorProcess.on("exit", (code) => {
      console.log(`Validator exited with code ${code}`);
    });

    setTimeout(() => reject(new Error("Validator startup timed out")), 5000);
  });
}

export function stopTestValidator(): void {
  if (validatorProcess) {
    validatorProcess.kill("SIGTERM");
    validatorProcess = null;
  }
}
