import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { MigrationCommand } from "./migration";
import { RewardCommands } from "./rewards";
import { StatsCommands } from "./stats";
import { VestingCommands } from "./vesting";
import { PaymentCommands } from "./payments";

yargs(hideBin(process.argv))
	.scriptName("effect-cli")
	.command(MigrationCommand)
	.command(RewardCommands)
	.command(StatsCommands)
	.command(VestingCommands)
	.command(PaymentCommands)
	.help().argv;
