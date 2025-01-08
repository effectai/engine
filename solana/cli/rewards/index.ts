import type { CommandModule } from "yargs";
import { rewardsAddFee } from "./topup";
import { rewardsInitCommand } from "./init";

export const RewardCommands: CommandModule = {
	command: "rewards <command>",
	describe: "Commands related to rewards",
	builder: (yargs) => yargs
    .command(rewardsInitCommand)
    .command(rewardsAddFee),
	handler: () => {
        // This should never be called
        console.error("Please provide a valid command");
    },
};
