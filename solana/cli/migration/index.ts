import type { CommandModule } from "yargs";
import { distributeMigrationCommand } from "./distribute";
import { createMigrationClaimCommand } from "./create";
import { fetchMigrationAccount } from "./fetch";
import { confirmMigrationCommand } from "./confirm";
import { createDistributionFileCommand } from "./create-distribution";
import { destroyMigrationClaimCommand } from "./destroy";
import { recreateMigrationClaimCommand } from "./recreate";

export const MigrationCommand: CommandModule = {
	command: "migration <command>",
	describe: "Commands related to migration",
	builder: (yargs) => yargs
    .command(distributeMigrationCommand)
    .command(createMigrationClaimCommand)
    .command(fetchMigrationAccount)
    .command(confirmMigrationCommand)
    .command(createDistributionFileCommand)
    .command(destroyMigrationClaimCommand)
    .command(recreateMigrationClaimCommand),
	handler: () => {
        // This should never be called
        console.error("Please provide a valid command");
    },
};
