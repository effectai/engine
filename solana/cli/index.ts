import yargs from "yargs";
import { createMigrationClaimCommand } from "./migration/create";
import { rewardsInitCommand } from "./rewards/init";
import { rewardsAddFee } from "./rewards/topup";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
	.scriptName("effect-cli")
	.command(createMigrationClaimCommand)
    .command(rewardsInitCommand)
    .command(rewardsAddFee)
    .help()
    .argv;
