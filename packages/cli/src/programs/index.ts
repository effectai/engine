import { Command } from "commander";
import { paymentsProgram } from "./payments/index.js";

export const programsProgram = new Command();

programsProgram
  .name("programs")
  .description("CLI for interacting with effect ai solana programs");

programsProgram.addCommand(paymentsProgram);
