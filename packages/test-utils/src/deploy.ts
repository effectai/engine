import { address } from "@solana/kit";
import { exec } from "child_process";

export async function deployProgram(
  soPath: string,
  keypairPath: string,
): Promise<PublicKey> {
  const url = "http://localhost:8898";

  const command = `pnpm mucho deploy ${soPath} --keypair ${keypairPath} --url ${url}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Failed to deploy program:", stderr || stdout);
        return reject(error);
      }

      const match = stdout.match(/Program Id: ([A-Za-z0-9]+)/);
      if (!match) {
        console.error("! Could not extract program ID from output:\n", stdout);
        return reject(new Error("Program ID not found"));
      }

      const programId = address(match[1]);
      console.log("✅ Program deployed with ID:", programId);
      resolve(programId);
    });
  });
}
