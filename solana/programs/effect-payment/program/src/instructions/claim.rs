use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{Mint, Token};
use effect_common::id::ADMIN_AUTHORITY;
use effect_common::transfer_tokens_to_vault;
use effect_migration_common::MigrationAccount;
use effect_common::cpi;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub payment_account: Account<'info, TokenAccount>,
}

pub fn handler(ctx: Context<Claim>,) -> Result<()> {
    Ok(())
}
