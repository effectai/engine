import { startCommand } from "./start.js";
import { taskCommand } from "./tasks.js";
import { templateCommand } from "./templates.js";
import { Command } from "commander";

export const managerProgram = new Command();

managerProgram
  .name("manager")
  .description("CLI for interacting with manager node");

managerProgram.addCommand(taskCommand);
managerProgram.addCommand(templateCommand);
managerProgram.addCommand(startCommand);
