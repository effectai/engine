import { Command } from "commander";
import { managerProgram } from "./manager/index.js";
import { programsProgram } from "./programs/index.js";
import { statusProgram } from "./status.js";
import { workerProgram } from "./worker/index.js";

export const effectCLI = new Command();

effectCLI
  .name("effectai-cli")
  .description("CLI for interacting with Effect AI")
  .version("0.1.0")
  .option("-k, --keypair <path>", "Path to JSON key file.")
  .option("-s, --solana-rpc <url>", "Solana RPC node.",
    "https://api.mainnet.solana.com");

effectCLI.addCommand(statusProgram);
effectCLI.addCommand(managerProgram);
effectCLI.addCommand(programsProgram);
effectCLI.addCommand(workerProgram);

effectCLI.parse(process.argv);
