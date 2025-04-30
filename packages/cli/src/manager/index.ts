import { runCommand } from "./run.js";
import { taskCommand } from "./tasks.js";
import { templateCommand } from "./templates.js";
import { program } from "commander";

program
  .name("manager-cli")
  .description("CLI for interacting with manager node")
  .version("0.1.0");

program.addCommand(taskCommand);
program.addCommand(templateCommand);
program.addCommand(runCommand);

program.parse(process.argv);
