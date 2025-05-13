mod errors;
mod instructions;
mod macros;
mod security;

use anchor_lang::prelude::*;
use effect_vesting_common::{EFFECT_VESTING};
use errors::*;
use instructions::*;
use effect_common::*;


declare_id!("effV6X5UGwHDjVxAMW1KjC4SsuEQT3dTkm8PQTMGV7S");

#[program]
pub mod effect_vesting {
    use super::*;

    /// Open a [PoolAccount](#pool-account) and [VaultAccount](#vault-account).
    pub fn open(
        ctx: Context<Open>,
        release_rate: u64,
        start_time: i64,
        is_closable: bool,
        tag: Option<[u8; 1]>,
    ) -> Result<()> {
        ctx.accounts.handler(
            release_rate,
            start_time,
            is_closable,
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
}
