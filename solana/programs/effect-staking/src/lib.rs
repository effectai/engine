mod errors;
mod instructions;
mod macros;
mod state;

use anchor_lang::prelude::*;
use effect_common::*;
 
pub use errors::*;
// expose errors for cpi
use instructions::*;
pub use state::*; // expose stake for cpi

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
        ctx.accounts.handler(amount, duration, ctx.bumps.vault)
    }

    /// Start the unstake duration.
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        ctx.accounts.handler()
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

    /// Withdraw  [NOS](/tokens/token) that is released after an [unstake](#unstake)
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
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
