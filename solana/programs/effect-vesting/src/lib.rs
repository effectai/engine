mod errors;
mod instructions;
mod macros;
mod security;
mod state;
mod types;

use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use effect_common::*;
use state::*;
use types::*;

declare_id!(id::POOLS_PROGRAM);

#[program]
pub mod effect_vesting {
    use super::*;

    /// Open a [PoolAccount](#pool-account) and [VaultAccount](#vault-account).
    pub fn open(
        ctx: Context<Open>,
        emission: u64,
        start_time: i64,
        claim_type: u8,
        closeable: bool,
    ) -> Result<()> {
        ctx.accounts.handler(
            emission,
            start_time,
            claim_type,
            closeable,
            *ctx.bumps.get("vault").unwrap(),
        )
    }

    /// Add fees from a [PoolAccount](#pool-account) with claim type [`1`](#claim-type)
    pub fn claim_fee(ctx: Context<ClaimFee>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Claim emission from a [PoolAccount](#pool-account) with claim type [`0`](#claim-type)
    pub fn claim_transfer(ctx: Context<ClaimTransfer>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Close a [PoolAccount](#pool-account) and [VaultAccount](#vault-account).
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    /// Update the beneficiary in a [PoolAccount](#pool-account).
    pub fn update_beneficiary(ctx: Context<UpdateBeneficiary>) -> Result<()> {
        ctx.accounts.handler()
    }
}
