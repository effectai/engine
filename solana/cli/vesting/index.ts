import type { CommandModule } from "yargs";
import { vestingCreateCommand } from "./create";
import { vestingClaimCommand } from "./claim";
import { vestingCloseCommand } from "./close";

export const VestingCommands: CommandModule = {
	command: "vesting <command>",
	describe: "Commands related to vesting",
	builder: (yargs) =>
		yargs
			.command(vestingCreateCommand)
			.command(vestingClaimCommand)
			.command(vestingCloseCommand),
	handler: () => {
		// This should never be called
		console.error("Please provide a valid command");
	},
};
