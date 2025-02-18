import type { CommandModule } from "yargs";
import { fetchStats } from "./fetch";

export const StatsCommands: CommandModule = {
  command: "stats <command>",
  describe: "Commands related to stats",
  builder: (yargs) => yargs.command(fetchStats),
  handler: () => {
    // This should never be called
    console.error("Please provide a valid command");
  },
};
