import { Command } from "commander";
import { paymentsProgram } from "./payments/index.js";
import { vestingProgram } from "./vesting/index.js";
import { migrationProgramCommand } from "./migration/index.js";

export const programsProgram = new Command();

programsProgram
  .name("programs")
  .description("CLI for interacting with effect ai solana programs");

programsProgram.addCommand(paymentsProgram);
programsProgram.addCommand(vestingProgram);
programsProgram.addCommand(migrationProgramCommand);
