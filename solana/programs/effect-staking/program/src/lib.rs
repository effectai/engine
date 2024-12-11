mod instructions;
mod macros;
mod state;
mod constants;
mod errors;

use anchor_lang::prelude::*;
use effect_common::*;
 
pub use errors::*;
pub use state::*; 
pub use instructions::*;

declare_id!("3FPg1CgXQAL6Va3EJ9W14R44cEGqHpATw6ADgkUwSspw");

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

    // pub fn init(ctx: Context<Init>) -> Result<()> {
    //     ctx.accounts.handler()
    // }

    // Reduce a [StakeAccount](#stake-account)'s [NOS](/tokens/token) tokens.
    // Slashing is a feature used by the Effect Protocol to punish bad actors.
    // pub fn slash(ctx: Context<Slash>, amount: u64) -> Result<()> {
    //     ctx.accounts.handler(amount)
    // }

    // Update the Slashing Authority and Token Account.
    // pub fn update_settings(ctx: Context<UpdateSettings>) -> Result<()> {
    //     ctx.accounts.handler()
    // }
}
