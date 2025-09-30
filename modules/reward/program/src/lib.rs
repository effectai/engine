mod errors;
mod instructions;
mod macros;
mod security;
mod state;

use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;
use effect_common::*;
use instructions::*;

pub use errors::*;
pub use state::*;

inject_declare_id_output!("../../../target/deploy/effect_reward-keypair.json");

declare_program!(effect_staking);

#[program]
pub mod effect_reward {
    use super::*;

    /// Initialize the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault_token_account-account).
    pub fn init(ctx: Context<Init>, scope: Pubkey) -> Result<()> {
        ctx.accounts.handler(scope)
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
