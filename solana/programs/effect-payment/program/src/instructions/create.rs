use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::id::ADMIN_AUTHORITY;
use effect_common::transfer_tokens_to_vault;
use effect_migration_common::MigrationAccount;
use effect_common::cpi;

#[derive(Accounts)]
#[instruction(foreign_address: Vec<u8>)]
pub struct Create<'info> {

}

pub fn handler(ctx: Context<Create>, foreign_address: Vec<u8>, stake_start_time: i64, amount: u64 ) -> Result<()> {
    Ok(())
}
