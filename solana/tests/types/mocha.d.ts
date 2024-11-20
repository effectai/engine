import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, PublicKey, Signer } from "@solana/web3.js";

import { constants } from "../contstants";
import {
  EffectAccounts,
  EffectBalances,
  EffectExists,
  EffectMarket,
  EffectTotals,
  EffectVaults,
  StakingProgram,
} from "./effect";

declare module "mocha" {
  export interface Context {
    // anchor
    provider: AnchorProvider;
    connection: Connection;

    // user
    wallet: Wallet;
    payer: Signer;
    publicKey: PublicKey;
    deposit: PublicKey;
    project: PublicKey;

    // mint
    mint: PublicKey;

    // main programs
    stakingProgram: StakingProgram;

    // dynamic values
    total: EffectTotals;
    balances: EffectBalances;
    market: EffectMarket;
    exists: EffectExists;

    // public key collections
    vaults: EffectVaults;
    accounts: EffectAccounts;

    // th constant values
    constants: typeof constants;

    //TODO : define Solana user types
    nodes;
    users;
  }
}
