mod instructions;
mod macros;
mod security;
mod errors;
mod state;

use anchor_lang::declare_id;
use anchor_lang::prelude::*;
use instructions::*;
use effect_common::*;

pub use errors::*;
pub use state::*;
pub use macros::*;

declare_id!("HJR3op52N7tNycXqQnVu8cDnxH7udp4pYi1ps9S1hdBz");

#[program]
pub mod effect_rewards {
    use super::*;

    /// Initialize the [ReflectionAccount](#reflection-account) and [VaultAccount](#vault_token_account-account).
    pub fn init(ctx: Context<Init>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Initialize a [RewardsAccount](#rewards-account).
    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Send [NOS](/tokens/token) to the [VaultAccount](#vault-account).
    pub fn claim_stream(ctx: Context<ClaimStream>, amount: u64) -> Result<()> {
        ctx.accounts.handler(amount)
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
