import { Command } from "commander";
import { startCommand } from "./start.js";

export const workerProgram = new Command();

workerProgram
  .name("worker")
  .description("CLI for running worker nodes");

workerProgram.addCommand(startCommand);
