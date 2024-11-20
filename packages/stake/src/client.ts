import type { Program, Idl } from "@coral-xyz/anchor";
import type { EffectStaking } from "./effect_staking.js"
import type { Connection, PublicKey } from "@solana/web3.js";

export type StakingConfigPreset = {
    connection: Connection;
    EFFECT_SPL_TOKEN_MINT: PublicKey;
}

export class StakeClient {
    config: StakingConfigPreset;
    program: Program<EffectStaking>;

    constructor(config: StakingConfigPreset, program: Program<EffectStaking>) { 
        this.config = config;
        this.program = program;
    }

}

export const createStakeClient = (config: StakingConfigPreset, program: Program<EffectStaking>) => {
    return new StakeClient(config, program);
}

export const createStakingConfig = (connection: Connection, EFFECT_SPL_TOKEN_MINT: PublicKey): StakingConfigPreset => {
    return {
        connection,
        EFFECT_SPL_TOKEN_MINT
    }
}