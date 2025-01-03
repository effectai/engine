import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {MigrationCommand} from './migration'
import { RewardCommands } from "./rewards";

yargs(hideBin(process.argv))
	.scriptName("effect-cli")
    .command(MigrationCommand)
    .command(RewardCommands)
    .help()
    .argv;
