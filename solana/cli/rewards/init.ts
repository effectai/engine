import * as anchor from "@coral-xyz/anchor";
import { type EffectRewards, EffectRewardsIdl } from "@effectai/shared";
import chalk from "chalk";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";

export const rewardsInitCommand: CommandModule<unknown, { mint: string }> = {
	describe: "Initializizes the reflection account",
	command: "rewards-init",
	builder: (yargs) =>
		yargs
			.option("mint", {
				type: "string",
				requiresArg: true,
				description: "The mint address for the token to be migrated",
			})
			.demandOption(["mint"]),
	handler: async ({ mint }) => {
		const { payer, provider } = await loadProvider();

		const rewardProgram = new anchor.Program(
			EffectRewardsIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectRewards>;

		await rewardProgram.methods
			.init()
			.accounts({
				mint,
			})
			.rpc();

		await rewardProgram.methods
			.initIntermediaryVault()
			.accounts({
				mint,
			})
			.rpc();
			
		console.log(
			chalk.green.bold(`Reflection account initialized for mint ${mint}`),
		);
	},
};
