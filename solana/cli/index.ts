import yargs from "yargs";
import { rewardsInitCommand } from "./rewards/init";
import { rewardsAddFee } from "./rewards/topup";
import { hideBin } from "yargs/helpers";
import {MigrationCommand} from './migration'

yargs(hideBin(process.argv))
	.scriptName("effect-cli")
    .command(MigrationCommand)
    .command(rewardsInitCommand)
    .command(rewardsAddFee)
    .help()
    .argv;
