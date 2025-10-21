mod errors;
mod instructions;
mod macros;
mod security;
mod state;

use anchor_id_injector::inject_declare_id_output;
use anchor_lang::prelude::*;
use effect_common::*;
use errors::*;
use instructions::*;

pub use state::*;

inject_declare_id_output!("../../../target/deploy/effect_vesting-keypair.json");

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
