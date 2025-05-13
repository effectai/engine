mod instructions;
mod macros;
mod state;
mod constants;
mod errors;

use anchor_lang::prelude::*;

use effect_common::*;
use effect_staking_common::{StakingProgram, EFFECT_STAKING};

pub use errors::*;
pub use state::*; 
pub use instructions::*;

declare_id!("effSujUiy4eT2vrMqSsUkb6oT3C7pC42UnWSukRpu5e");

#[program]
pub mod effect_staking {
    use super::*;

    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
        ctx.accounts.handler(amount, duration)
    }

    pub fn stake_genesis(ctx: Context<GenesisStake>, amount: u64, stake_start_time: i64) -> Result<()> {
        ctx.accounts.handler(amount, stake_start_time)
    }

    /// Start the unstake duration.
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount) 
    }

    /// Top-up `amount` of [NOS](/tokens/token) of a [StakeAccount](#stake-account).
    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    /// Close a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

}
