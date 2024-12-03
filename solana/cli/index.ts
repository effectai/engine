import yargs from "yargs";
import { createMigrationClaimCommand } from "./migration/create";
import { rewardsInitCommand } from "./rewards/init";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
	.scriptName("effect-cli")
	.command(createMigrationClaimCommand)
    .command(rewardsInitCommand)
    .help()
    .argv;
