mod constants;
mod errors;
mod instructions;
mod macros;
mod state;

use anchor_lang::prelude::*;

use effect_common::*;

pub use errors::*;
pub use instructions::*;
pub use state::*;

#[cfg(feature = "localnet")]
declare_id!("G6LoTk4GvX15kkqQxmutqyRdS7WjE5GsgnUrhP4WADWn");
#[cfg(feature = "mainnet")]
declare_id!("effSujUiy4eT2vrMqSsUkb6oT3C7pC42UnWSukRpu5e");

declare_effect_program!(effect_migration, effect_migration_localnet);
declare_effect_program!(effect_vesting, effect_vesting_localnet);
declare_effect_program!(effect_rewards, effect_rewards_localnet);

#[program]
pub mod effect_staking {
    use super::*;

    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
        ctx.accounts.handler(amount, duration)
    }

    pub fn stake_genesis(
        ctx: Context<GenesisStake>,
        amount: u64,
        stake_start_time: i64,
    ) -> Result<()> {
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
