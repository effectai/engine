import type { CommandModule } from "yargs";
import { loadProvider } from "../../utils/provider";

import * as anchor from "@coral-xyz/anchor";
import {
	useDeriveRewardAccounts,
	useDeriveVestingAccounts,
} from "@effectai/utils";
import {
	type EffectVesting,
	EffectVestingIdl,
	EffectRewardsIdl,
	type EffectRewards,
} from "@effectai/shared";
import { PublicKey } from "@solana/web3.js";
import pLimit from "p-limit";

export const fetchStats: CommandModule<unknown, { mint: string }> = {
	describe: "Fetch stats",
	command: "fetch",
	handler: async () => {
		const { provider } = await loadProvider();

		const mint = new PublicKey("EFFECT1A1R3Dz8Hg4q5SXKjkiPc6KDRUWQ7Czjvy4H7E");

		const vestingProgram = new anchor.Program(
			EffectVestingIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectVesting>;

		const rewardProgram = new anchor.Program(
			EffectRewardsIdl as anchor.Idl,
			provider,
		) as unknown as anchor.Program<EffectRewards>;

		const vestingAccounts = await vestingProgram.account.vestingAccount.all();
		const { reflectionAccount } = useDeriveRewardAccounts({
			mint,
			programId: rewardProgram.programId,
		});
		const reflectionDataAccount =
			await rewardProgram.account.reflectionAccount.fetch(reflectionAccount);

		// Batch processing
		const CHUNK_SIZE = 1; // Number of accounts processed in a batch
		const CONCURRENT_LIMIT = 1; // Max concurrent batches
		const limit = pLimit(CONCURRENT_LIMIT);

		const fetchVestingVaultBalances = async (
			accounts: typeof vestingAccounts,
		) => {
			const tasks = accounts.map((account) =>
				limit(async () => {
					const { vestingVaultAccount } = useDeriveVestingAccounts({
						vestingAccount: account.publicKey,
						programId: vestingProgram.programId,
					});

					console.log("Fetching balance for account: ", account.publicKey.toString());
					const accountInfo =
						await provider.connection.getTokenAccountBalance(
							vestingVaultAccount,
						);

					return accountInfo.value.uiAmount || 0;
				}),
			);
			return await Promise.all(tasks);
		};

		// Divide into chunks
		const chunks = [];
		for (let i = 0; i < vestingAccounts.length; i += CHUNK_SIZE) {
			chunks.push(vestingAccounts.slice(i, i + CHUNK_SIZE));
		}

		let totalUnstakeAmount = 0;

		for (const chunk of chunks) {
			const balances = await fetchVestingVaultBalances(chunk);
			totalUnstakeAmount += balances.reduce((a, b) => a + b, 0);
		}

		console.log("Total vesting accounts: ", vestingAccounts.length);
		console.log("Total unstake amount: ", totalUnstakeAmount);
	},
};
