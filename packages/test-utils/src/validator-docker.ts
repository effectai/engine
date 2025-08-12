import { spawn } from "child_process";

let docker: ReturnType<typeof spawn>;

export async function startValidator() {
  docker = spawn("docker", [
    "run",
    "--rm",
    "--name",
    "solana-test-validator",
    "--ulimit",
    "nofile=1000000:1000000",
    "-p",
    "8898:8898",
    "-p",
    "8901:8901",
    "anzaxyz/agave:stable",
    "solana-test-validator",
    "--reset",
    "--quiet",
  ]);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ Solana validator assumed ready after 3s");
      resolve();
    }, 3000);
  });
}

export async function stopValidator() {
  if (docker) docker.kill("SIGTERM");
}
