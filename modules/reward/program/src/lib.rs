mod errors;
mod instructions;
mod macros;
mod security;
mod state;

use anchor_lang::declare_id;
use anchor_lang::prelude::*;
use effect_common::*;
use instructions::*;

pub use errors::*;
pub use state::*;

#[cfg(feature = "localnet")]
declare_id!("4HxNuPxwpqMdE9SBbEYaYWuSe23zAtoZTG8HMNcEMQzd");
#[cfg(feature = "mainnet")]
declare_id!("effRBsQPi2Exq4NWN6SPiCQk4E6BvXkqiBeu6saMxoi");

declare_effect_program!(effect_staking, effect_staking_localnet);

#[program]
pub mod effect_rewards {
    use super::*;

    /// Initialize the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault_token_account-account).
    pub fn init(ctx: Context<Init>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn init_intermediary_vault(ctx: Context<InitIntermediaryVault>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Topup the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault_token_account-account).
    pub fn topup(ctx: Context<Topup>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Initialize a [RewardsAccount](#rewards-account).
    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Claim rewards from a [RewardsAccount](#rewards-account) and [VaultAccount](#vault-account).
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Re-calculate reflection points.
    pub fn sync(ctx: Context<Sync>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Close a [RewardsAccount](#rewards-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }
}
