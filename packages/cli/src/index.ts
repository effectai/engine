import { Command } from "commander";
import { managerProgram } from "./manager/index.js";

export const effectCLI = new Command();

effectCLI
  .name("effectai-cli")
  .description("CLI for interacting with Effect AI")
  .version("0.1.0");

effectCLI.addCommand(managerProgram);

effectCLI.parse(process.argv);
