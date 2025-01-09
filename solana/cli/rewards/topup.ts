import * as anchor from "@coral-xyz/anchor";
import { type EffectRewards, EffectRewardsIdl } from "@effectai/shared";
import chalk from "chalk";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";
import { PublicKey } from "@solana/web3.js";

export const rewardsAddFee: CommandModule<
	unknown,
	{ mint: string; amount: number }
> = {
	describe: "Top up the reflection account",
	command: "topup",
	builder: (yargs) =>
		yargs
			.option("mint", {
				type: "string",
				requiresArg: true,
				description: "The mint address for the token to be used for rewards",
			})
			.demandOption(["mint"]),
	handler: async ({ mint, amount }) => {
		const { payer, provider } = await loadProvider();

		const rewardProgram = new anchor.Program(
			EffectRewardsIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectRewards>;

		const result = await rewardProgram.methods
			.topup()
			.accounts({
				mint: new PublicKey(mint),
			})
			.rpc();

		console.log(chalk.green.bold(`topup tx: ${result}`));
	},
};
