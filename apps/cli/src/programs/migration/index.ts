import { Command } from "commander";
import { registerCreateMigrationClaim } from "./create.js";

export const migrationProgramCommand = new Command();

migrationProgramCommand
  .name("migration")
  .description("CLI for interacting with the migration program");

registerCreateMigrationClaim(migrationProgramCommand);
