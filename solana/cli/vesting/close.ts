import * as anchor from "@coral-xyz/anchor";
import { EffectVestingIdl, type EffectVesting } from "@effectai/shared";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";
import { PublicKey } from "@solana/web3.js";
import {
    getAssociatedTokenAddressSync
} from "@solana/spl-token";

export const vestingCloseCommand: CommandModule<
	unknown,
	{
		mint: string;
		account: string;
	}
> = {
	describe: "close a vesting account",
	command: "close",
	builder: (yargs) =>
		yargs
			.option("account", {
				type: "string",
				requiresArg: true,
				description: "The vesting account to close",
			})
			.option("mint", {
				type: "string",
				requiresArg: true,
				description: "The mint address for the vesting account to be closed",
			}),
	handler: async ({ account, mint }) => {
		const { payer, provider } = await loadProvider();

		const vestingProgram = new anchor.Program(
			EffectVestingIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectVesting>;

		const ata = getAssociatedTokenAddressSync(new PublicKey(mint), payer.publicKey);

		await vestingProgram.methods
			.close()
			.accounts({
				recipientTokenAccount: ata,
				vestingAccount: new PublicKey(account),
			})
			.rpc();

		console.log(`closed vesting for account ${account}`);
	},
};
