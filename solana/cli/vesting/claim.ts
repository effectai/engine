import * as anchor from "@coral-xyz/anchor";
import { EffectVestingIdl, type EffectVesting } from "@effectai/idl";
import { loadProvider } from "../../utils/provider";

import type { CommandModule } from "yargs";
import { PublicKey } from "@solana/web3.js";

export const vestingClaimCommand: CommandModule<
  unknown,
  {
    mint: string;
    account: string;
  }
> = {
  describe: "claims a vesting account",
  command: "claim",
  builder: (yargs) =>
    yargs.option("account", {
      type: "string",
      requiresArg: true,
      description: "The vesting account to claim",
    }),
  handler: async ({ account }) => {
    const { payer, provider } = await loadProvider();

    const vestingProgram = new anchor.Program(
      EffectVestingIdl as anchor.Idl,
      provider,
    ) as unknown as anchor.Program<EffectVesting>;

    await vestingProgram.methods
      .claim()
      .accounts({
        vestingAccount: new PublicKey(account),
      })
      .rpc();

    console.log(`Claimed tokens for account ${account}`);
  },
};
