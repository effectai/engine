import type { CommandModule } from "yargs";
import { distributeMigrationCommand } from "./distribute";
import { createMigrationClaimCommand } from "./create";
import { fetchMigrationAccount } from "./fetch";

export const MigrationCommand: CommandModule = {
	command: "migration <command>",
	describe: "Commands related to migration",
	builder: (yargs) => yargs
    .command(distributeMigrationCommand)
    .command(createMigrationClaimCommand)
    .command(fetchMigrationAccount),
	handler: () => {
        // This should never be called
        console.error("Please provide a valid command");
    },
};
