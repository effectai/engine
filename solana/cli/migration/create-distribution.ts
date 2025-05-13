import chalk from "chalk";
import { writeFileSync, readFileSync } from "fs";

import type { CommandModule } from "yargs";
const csv = require("csvtojson");

const createDistributionFile = async (
  csvFilePath: string,
  outputDir: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    csv()
      .fromFile(csvFilePath)
      .then((rows) => {
        try {
          console.log(chalk.green("Creating new distribution file..."));
          const timestamp = Math.floor(Date.now() / 1000);
          const chosen_distribution_file = `${outputDir}/distribution-${timestamp}.json`;
          const data = rows.map((row) => ({
            foreign_key: row.key,
            stake_age: row.stake_age_timestamp,
            amount: row.claim_amount,
            status: 0,
          }));
          writeFileSync(
            chosen_distribution_file,
            JSON.stringify(data, null, 2)
          );
          resolve(chosen_distribution_file); // Resolve with the file path
        } catch (error) {
          reject(error); // Reject if there's an error
        }
      })
      .catch(reject); // Catch CSV parsing errors
  });
};

export const createDistributionFileCommand: CommandModule<
  unknown,
  { target: string }
> = {
  describe: "Distributes the migration accounts based on a csv file",
  command: "create-distribution",
  builder: (yargs) => {
    yargs.option("target", {
      type: "string",
      description: "The path to the csv file",
      requiresArg: true,
    });
  },
  handler: async ({ target }) => {
    createDistributionFile(target, "./cli/data");
  },
};
