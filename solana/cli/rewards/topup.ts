import * as anchor from "@coral-xyz/anchor";
import { type EffectRewards, EffectRewardsIdl } from "@effectai/shared";
import chalk from "chalk";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";
import { createKeypairFromFile, useDeriveRewardAccounts } from "@effectai/utils";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, transfer } from "@solana/spl-token";

export const rewardsAddFee: CommandModule<unknown, { mint: string, amount:number }> = {
	describe: "Top up the reflection account",
	command: "rewards topup",
	builder: (yargs) =>
		yargs
			.option("amount", {
				type: "number",
				requiresArg: true,
				description: "The amount of tokens to be sent to the reflection account",
			})
			.option("mint", {
				type: "string",
				requiresArg: true,
				description: "The mint address for the token to be used for rewards",
			})
			.demandOption(["mint"]),
	handler: async ({ mint, amount }) => {
		const { payer, provider } = await loadProvider();

		const mintKey = new PublicKey(mint);

		const rewardProgram = new anchor.Program(
			EffectRewardsIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectRewards>;

		const {intermediaryReflectionVaultAccount} = useDeriveRewardAccounts({
			mint: mintKey,
			programId: rewardProgram.programId,
		})

		// get ata for the mint
		const ata = getAssociatedTokenAddressSync(
			mintKey,
			payer.publicKey,
		)

		// transfer the tokens to the reflection account
		await transfer(provider.connection, payer, ata, intermediaryReflectionVaultAccount, payer, amount);

		const result = await rewardProgram.methods
			.topup()
			.accounts({
				mint: new PublicKey(mint),
			})
			.rpc()

		console.log(
			chalk.green.bold(`topup successfull tx: ${result}`),
		);
	},
}
