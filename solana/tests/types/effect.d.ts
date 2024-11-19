import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Program } from "@coral-xyz/anchor";
// @ts-ignore
import { EffectStaking } from "../../target/types/effect_staking";

type StakingProgram = Program<EffectStaking>;

type EffectTotals = {
  xefx: BN;
  reflection: BN;
  rate: BN;
};

type EffectExists = {
  stake: boolean;
  pool: boolean;
  market: boolean;
};

type EffectVaults = {
  staking: PublicKey;
};

type EffectBalances = {
  user: number;
  vaultStaking: number;
};

type EffectAccounts = {
  systemProgram: PublicKey;
  tokenProgram: PublicKey;
  stakingProgram: PublicKey;

  // sys vars
  rent: PublicKey;

  // main user
  authority: PublicKey;
  payer: PublicKey;
  project: PublicKey;

  // token
  mint: PublicKey;

  // token accounts
  vault: PublicKey;
  tokenAccount: PublicKey;
  user: PublicKey;
  deposit: PublicKey;

  // staking specific
  settings: PublicKey;
  stake: PublicKey;
};
