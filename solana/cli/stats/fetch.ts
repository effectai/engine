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
  EffectMigrationIdl,
  type EffectMigration,
  EffectStakingIdl,
  EffectStaking,
} from "@effectai/idl";
import { PublicKey } from "@solana/web3.js";
import pLimit from "p-limit";
import { BN } from "bn.js";

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

    const migrationProgram = new anchor.Program(
      EffectMigrationIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectMigration>;

    const rewardProgram = new anchor.Program(
      EffectRewardsIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectRewards>;

    const stakingProram = new anchor.Program(
      EffectStakingIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectStaking>;

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

          console.log(
            "Fetching balance for account: ",
            account.publicKey.toString(),
          );
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
      // chunks.push(vestingAccounts.slice(i, i + CHUNK_SIZE));
    }

    let totalUnstakeAmount = 0;

    for (const chunk of chunks) {
      const balances = await fetchVestingVaultBalances(chunk);
      totalUnstakeAmount += balances.reduce((a, b) => a + b, 0);
      // wait 2 seconds before processing the next batch
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const migrationAccounts =
      await migrationProgram.account.migrationAccount.all();
    const totalStaked = reflectionDataAccount.totalWeightedAmount
      .div(new BN(1e6))
      .toNumber();

    const developmentFund = new PublicKey(
      "9oPYQNEi1tp9bNjWCZx5ibkL2n8SP7Nnkt1oZ9VoBhRq",
    );
    const daoTreasuryAccount = new PublicKey(
      "Gw4PdHrwnSKkjDcazqKarvh6qFA9FLegq2hUw75q6SR2",
    );
    const stakingTreasuryAccount = new PublicKey(
      "6UmiLmF7yJrcAMCjdUd686RU2cz8tdXsaHcadRQvUP1R",
    );
    const liquidityTreasuryAccount = new PublicKey(
      "F79r42pn3yvSxfhiteb1FHey7mANRpK2KVNpiUGTvSg",
    );
    const exemptions = [
      developmentFund,
      daoTreasuryAccount,
      stakingTreasuryAccount,
      liquidityTreasuryAccount,
    ];

    const totalExemptionsBalances = await Promise.all(
      exemptions.map(async (account) => {
        const accountInfo =
          await provider.connection.getTokenAccountBalance(account);
        return accountInfo.value.uiAmount || 0;
      }),
    );

    const totalExemptions = totalExemptionsBalances.reduce((a, b) => a + b, 0);

    const totalLockedSupply =
      totalStaked + totalUnstakeAmount + totalExemptions;
    const totalSupply = 520_000_000;
    const circulatingSupply = totalSupply - totalLockedSupply;

    const stakingAccounts = await stakingProram.account.stakeAccount.all();

    console.log("staking accounts:", stakingAccounts.length);
    console.log("Total supply: ", totalSupply);
    console.log("Total Migration accounts: ", migrationAccounts.length);
    console.log("Total Staked:", totalStaked);
    console.log("Total vesting accounts: ", vestingAccounts.length);
    console.log("Total unstake amount: ", totalUnstakeAmount);
    console.log("Total exemptions: ", totalExemptions);
    console.log("Total locked supply: ", totalLockedSupply);
    console.log("Circulating supply: ", circulatingSupply);
  },
};
