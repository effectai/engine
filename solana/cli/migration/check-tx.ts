import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";
import chalk from "chalk";
import { writeFileSync, readFileSync } from "fs";

export const confirmMigrationCommand: CommandModule<
	unknown,
	{ distribution_file: string, mint: string }
> = {
	describe: "checks transaction based on a json file",
	command: "check-tx",
	builder: (yargs) => {
		yargs
			.option("mint", {
				type: "string",
				demandOption: true,
				description: "The mint address of the token to distribute",
			})
			.option("distribution_file", {
				demandOption: true,
				type: "string",
				description: "The path to the distribution file",
			});
	},
	handler: async ({ mint, distribution_file }) => {
		const { provider } = await loadProvider();

		const delay = 1000 / 5; // 1 TPS

		const rows = JSON.parse(readFileSync(distribution_file, "utf-8"));

		for (const row of rows.filter((row) => row.status === 0 || row.status === 1)) {
			console.log(`Checking transaction ${row.tx}`);

            const result = await provider.connection.getParsedTransaction(row.tx)

			if (result) {
				row.status = 2; // confirmed
				console.log(chalk.green(`transaction ${row.foreign_key} confirmed`));
			} else {
				row.status = 0; // not found
				console.log(chalk.red(`transaction ${row.tx} not found`));
			}

			// write
			writeFileSync(distribution_file, JSON.stringify(rows, null, 2));

			// wait 1 second
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	},
};
