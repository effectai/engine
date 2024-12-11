mod errors;
mod instructions;
mod macros;
mod security;
mod types;
mod state;

use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use effect_common::*;


declare_id!("GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe");

#[program]
pub mod effect_vesting {
    use super::*;

    /// Open a [PoolAccount](#pool-account) and [VaultAccount](#vault-account).
    pub fn open(
        ctx: Context<Open>,
        release_rate: u64,
        start_time: i64,
        is_closable: bool,
        is_restricted_claim: bool,
        tag: Option<[u8; 1]>,
    ) -> Result<()> {
        ctx.accounts.handler(
            release_rate,
            start_time,
            is_closable,
            is_restricted_claim,
            tag,
        )
    }

    /// Claim emission from a [PoolAccount](#pool-account) with claim type [`0`](#claim-type)
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Close a [PoolAccount](#pool-account) and [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Update the beneficiary in a [PoolAccount](#pool-account).
    pub fn update_recipient(ctx: Context<UpdateRecipientTokenAccount>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn update_authority(ctx: Context<UpdateAuthority>) -> Result<()> {
        ctx.accounts.handler()
    }
}
