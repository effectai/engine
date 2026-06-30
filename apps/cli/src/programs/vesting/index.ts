import { Command } from "commander";
import { vestingCreateCommand } from "./create.js";

export const vestingProgram = new Command()

  .name("vesting")
  .description("CLI for interacting with the vesting program")
  .addCommand(vestingCreateCommand);
