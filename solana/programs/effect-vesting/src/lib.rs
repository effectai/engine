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
use types::*;
use state::*;

declare_id!("GSzDavs4yP5jqnVTnjjmJ9DJ5yUQ6AB7vBTNv2BBmaSe");

#[program]
pub mod effect_vesting {
    use super::*;

    /// Open a [PoolAccount](#pool-account) and [VaultAccount](#vault-account).
    pub fn open(
        ctx: Context<Open>,
        release_rate: u64,
        start_time: i64,
        claim_type: u8,
        is_closable: bool,
    ) -> Result<()> {
        ctx.accounts.handler(
            release_rate,
            start_time,
            claim_type,
            is_closable,
            ctx.bumps.vault_token_account
        )
    }

    /// Add fees from a [PoolAccount](#pool-account) with claim type [`1`](#claim-type)
    // pub fn claim_fee(ctx: Context<ClaimFee>) -> Result<()> {
    //     ctx.accounts.handler()
    // }

    /// Claim emission from a [PoolAccount](#pool-account) with claim type [`0`](#claim-type)
    pub fn claim_transfer(ctx: Context<ClaimTransfer>) -> Result<()> {
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
}
