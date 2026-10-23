import { Command } from "commander";
import { registerInitRewardCommand } from "./init.js";

export const rewardProgramCommand = new Command();

rewardProgramCommand
  .name("reward")
  .description("CLI for interacting with the reward program");

registerInitRewardCommand(rewardProgramCommand);
