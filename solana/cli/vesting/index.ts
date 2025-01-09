import type { CommandModule } from "yargs";
import { vestingCreateCommand } from "./create";

export const VestingCommands: CommandModule = {
	command: "vesting <command>",
	describe: "Commands related to vesting",
	builder: (yargs) => yargs
        .command(vestingCreateCommand),
	handler: () => {
        // This should never be called
        console.error("Please provide a valid command");
    },
};
