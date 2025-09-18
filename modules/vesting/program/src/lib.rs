mod errors;
mod instructions;
mod macros;
mod security;
mod state;

use anchor_lang::prelude::*;
use effect_common::*;
use errors::*;
use instructions::*;

pub use state::*;

#[cfg(feature = "localnet")]
declare_id!("93Wj1k8a7x7FC4abXoEZVrq2ujaeFwB2Q31JvKosBz8F");
#[cfg(feature = "mainnet")]
declare_id!("effV6X5UGwHDjVxAMW1KjC4SsuEQT3dTkm8PQTMGV7S");

#[program]
pub mod effect_vesting {
    use super::*;

    pub fn open(
        ctx: Context<Open>,
        release_rate: u64,
        start_time: i64,
        is_closable: bool,
        tag: Option<[u8; 1]>,
    ) -> Result<()> {
        ctx.accounts
            .handler(release_rate, start_time, is_closable, tag)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.handler()
    }

    pub fn update_recipient(ctx: Context<UpdateRecipientTokenAccount>) -> Result<()> {
        ctx.accounts.handler()
    }
}
