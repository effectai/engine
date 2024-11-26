mod instructions;
mod macros;
mod state;
mod constants;
mod errors;

use anchor_lang::prelude::*;
use effect_common::*;
 
pub use errors::*;
// expose errors for cpi
use instructions::*;
pub use state::*; // expose stake for cpi

pub use effect_common::state::stake_program::StakeAccount;

declare_id!("eR1sM73NpFqq7DSR5YDAgneWW29AZA8sRm1BFakzYpH");

#[program]
pub mod effect_staking {
    use super::*;

    /// Initialize the [SettingsAccount](#settings-account).
    // pub fn init(ctx: Context<Init>) -> Result<()> {
    //     ctx.accounts.handler()
    // }

    /// Create a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).
    /// Stake `amount` of [NOS](/tokens/token) tokens for `duration` fo seconds.
    pub fn stake(ctx: Context<Stake>, amount: u64, duration: u128) -> Result<()> {
        ctx.accounts.handler(amount, duration, ctx.bumps.vault_token_account)
    }

    pub fn stake_genesis(ctx: Context<GenesisStake>, amount: u64, duration: u128, stake_start_time: i64) -> Result<()> {
        ctx.accounts.handler(amount, duration, ctx.bumps.vault_token_account, stake_start_time)
    }

    /// Start the unstake duration.
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount) 
    }

    /// Make a stake active again and reset the unstake time.
    pub fn restake(ctx: Context<Restake>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Top-up `amount` of [NOS](/tokens/token) of a [StakeAccount](#stake-account).
    pub fn topup(ctx: Context<Topup>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
    }

    /// Extend the `duration` of a [StakeAccount](#stake-account).
    pub fn extend(ctx: Context<Extend>, duration: u64) -> Result<()> {
        ctx.accounts.handler(duration)
    }

    /// Close a [StakeAccount](#stake-account) and [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

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
